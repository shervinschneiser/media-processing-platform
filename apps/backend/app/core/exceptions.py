import traceback
from fastapi import Request
from fastapi.responses import JSONResponse


# async def global_exception_handler(
#     request: Request,
#     exc: Exception,
# ):
#     return JSONResponse(
#         status_code=500,
#         content={
#             "success": False,
#             "detail": "Internal server error",
#         },
#     )


async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    traceback.print_exc()

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": str(exc),
        },
    )