import subprocess
from pathlib import Path
from uuid import uuid4

from PIL import Image
from pdf2image import convert_from_path

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.core.config import settings

from app.models.job import Job, JobStatus, JobType

def _run_ffmpeg(input_path: Path, output_path: Path, extra_args: list[str] | None = None) -> None:
    args = ["ffmpeg", "-y", "-i", str(input_path)]
    if extra_args:
        args += extra_args
    args.append(str(output_path))

    result = subprocess.run(args, capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed:\n{result.stderr}")


def _process_video(input_path: Path, output_path: Path, output_format: str) -> None:
    if output_format == "mp3":
        _run_ffmpeg(
            input_path,
            output_path,
            extra_args=["-vn", "-acodec", "libmp3lame", "-q:a", "2"],
        )
    else:
        # container conversions (mp4/mkv/avi/webm)
        _run_ffmpeg(
            input_path,
            output_path,
            extra_args=["-c:v", "copy", "-c:a", "copy"],
        )


def _process_audio(input_path: Path, output_path: Path, output_format: str) -> None:
    codec_map = {
        "mp3": "libmp3lame",
        "wav": "pcm_s16le",
        "ogg": "libvorbis",
        "flac": "flac",
    }
    codec = codec_map.get(output_format)
    if not codec:
        raise ValueError(f"Unsupported audio output format: {output_format}")

    _run_ffmpeg(input_path, output_path, extra_args=["-acodec", codec])


def _process_image(input_path: Path, output_path: Path, output_format: str) -> None:
    if output_format == "pdf":
        with Image.open(input_path) as img:
            rgb_img = img.convert("RGB")
            rgb_img.save(output_path, "PDF")
        return

    _run_ffmpeg(input_path, output_path)


def _process_document(input_path: Path, output_path: Path, output_format: str) -> None:
    if output_format not in ("png", "jpg", "jpeg"):
        raise ValueError(f"Unsupported document output format: {output_format}")

    pages = convert_from_path(str(input_path), dpi=200)

    if not pages:
        raise RuntimeError("PDF has no pages to convert")

    # only convert first page for now
    first_page = pages[0]

    save_format = "JPEG" if output_format in ("jpg", "jpeg") else "PNG"
    first_page.convert("RGB").save(output_path, save_format)

PERMANENT_ERRORS = (FileNotFoundError, ValueError, NotImplementedError)

@celery_app.task(
    name="process_job",
    bind=True,
    max_retries=3,
    default_retry_delay=10,
)
def process_job(self, job_id: int):
    db = SessionLocal()
    job = None
    
    try:
        job = db.get(Job, job_id)

        if job is None:
            return

        input_path = Path(job.input_file_path)

        if not input_path.exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")

        output_dir = Path(settings.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        output_filename = f"{uuid4()}.{job.output_format}"
        output_path = output_dir / output_filename

        job.status = JobStatus.PROCESSING
        db.commit()

        if job.job_type == JobType.VIDEO:
            _process_video(input_path, output_path, job.output_format)
        elif job.job_type == JobType.AUDIO:
            _process_audio(input_path, output_path, job.output_format)
        elif job.job_type == JobType.IMAGE:
            _process_image(input_path, output_path, job.output_format)
        elif job.job_type == JobType.DOCUMENT:
            _process_document(input_path, output_path, job.output_format)
        else:
            raise ValueError(f"Unknown job type: {job.job_type}")

        
        job.output_file_path = str(output_path)
        job.status = JobStatus.COMPLETED
        db.commit()

    except PERMANENT_ERRORS as exc:
        # retry won't help:)
        if job:
            job.status = JobStatus.FAILED
            job.error_message = str(exc)
            db.commit()
        raise

    except Exception as exc:
        if self.request.retries < self.max_retries:
            # exponential backoff: 10s, 20s, 40s
            countdown = self.default_retry_delay * (2 ** self.request.retries)
            raise self.retry(exc=exc, countdown=countdown)

        # end of all retries (Failed)
        if job:
            job.status = JobStatus.FAILED
            job.error_message = str(exc)
            db.commit()
        raise

    finally:
        db.close()