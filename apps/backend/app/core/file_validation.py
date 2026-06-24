import magic

MIME_TO_EXTENSIONS: dict[str, list[str]] = {
    "video/mp4": ["mp4"],
    "video/x-matroska": ["mkv"],
    "video/x-msvideo": ["avi"],
    "video/webm": ["webm"],
    "audio/mpeg": ["mp3"],
    "audio/wav": ["wav"],
    "audio/x-wav": ["wav"],
    "audio/ogg": ["ogg"],
    "audio/flac": ["flac"],
    "audio/x-flac": ["flac"],
    "image/png": ["png"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/webp": ["webp"],
    "image/avif": ["avif"],
    "image/gif": ["gif"],
    "application/pdf": ["pdf"],
}

MAX_FILE_SIZE_BYTES = {
    "video": 2 * 1024 * 1024 * 1024,   # 2GB
    "audio": 200 * 1024 * 1024,        # 200MB
    "image": 50 * 1024 * 1024,         # 50MB
    "document": 100 * 1024 * 1024,     # 100MB
}


def detect_mime_type(file_bytes: bytes) -> str:
    return magic.from_buffer(file_bytes, mime=True)


def is_mime_consistent_with_extension(mime_type: str, extension: str) -> bool:
    allowed_extensions = MIME_TO_EXTENSIONS.get(mime_type)
    if allowed_extensions is None:
        return False
    return extension.lower() in allowed_extensions