from app.models.job import JobType

VIDEO_CONTAINERS = ["mp4", "mkv", "avi", "webm"]

FORMAT_MAP: dict[str, tuple[JobType, list[str]]] = {
    # video 
    "mp4":  (JobType.VIDEO, [c for c in VIDEO_CONTAINERS if c != "mp4"] + ["mp3"]),
    "mkv":  (JobType.VIDEO, [c for c in VIDEO_CONTAINERS if c != "mkv"] + ["mp3"]),
    "avi":  (JobType.VIDEO, [c for c in VIDEO_CONTAINERS if c != "avi"] + ["mp3"]),
    "webm": (JobType.VIDEO, [c for c in VIDEO_CONTAINERS if c != "webm"] + ["mp3"]),

    # audio
    "mp3":  (JobType.AUDIO, ["wav", "ogg", "flac"]),
    "wav":  (JobType.AUDIO, ["mp3", "ogg", "flac"]),
    "flac": (JobType.AUDIO, ["mp3", "wav", "ogg"]),

    # image
    "png":  (JobType.IMAGE, ["jpg", "webp", "avif", "gif", "pdf"]),
    "jpg":  (JobType.IMAGE, ["png", "webp", "avif", "pdf"]),
    "jpeg": (JobType.IMAGE, ["png", "webp", "avif", "pdf"]),
    "webp": (JobType.IMAGE, ["png", "jpg", "avif"]),
    "avif": (JobType.IMAGE, ["png", "jpg", "webp"]),

    # document
    "pdf":  (JobType.DOCUMENT, ["png", "jpg"]),
}


def get_job_type(input_format: str) -> JobType:
    entry = FORMAT_MAP.get(input_format.lower())
    if entry is None:
        raise ValueError(f"Unsupported input format: {input_format}")
    return entry[0]


def get_supported_targets(input_format: str) -> list[str]:
    entry = FORMAT_MAP.get(input_format.lower())
    if entry is None:
        raise ValueError(f"Unsupported input format: {input_format}")
    return entry[1]


def is_conversion_supported(input_format: str, output_format: str) -> bool:
    entry = FORMAT_MAP.get(input_format.lower())
    if entry is None:
        return False
    return output_format.lower() in entry[1]