
// Method 1:Using promise

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}
export { asyncHandler }




/* 
// Method 2 : Using async await 

const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            res
                .status(error.code || 500)
                .json({
                    success: false,
                    message: error.message
                })
        }
    }
}

export default asyncHandler

*/