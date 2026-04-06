const asyncHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}




/*const asyncHandler=(fn)=>async(req,res,next)=>{
    try{
        fn(req,res,next);
    }
    catch{
        res.status(err.code||500).json({
            sucess:false,
            message:err.message
        })
    }
}*/