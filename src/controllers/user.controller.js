import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/Apiresponse.js"

const generateAccesstokenansRefreshToken=async(userID)=>{
  try {
    const user=await User.findById(userID);
    const accessToken=user.generateAccessToken()
    const  refreshToken=user.generateRefreshToken()
    user.refreshToken=refreshToken;
     await user.save({validateBeforeSave:false})
     return {accessToken,refreshToken};
  } catch (error) {
    throw new ApiError(500,"something went wrong while creating tokens ")
  }
}
const registerUser=asyncHandler(async(req,res)=>{
    //get user details from frontend
    //validation-not empty
    //check if user already exist:username email
     //check for images check for avatar
     //upload them to cloudinary,avatar
     //create user  object-create entry in db
     //remove password and refresh token field from response
     //check for user creation
     //return response
     //return res
    
    const{fullName,email,userName,password}=req.body
   
     if(fullName===""){
        throw new ApiError(400,"fullname is required")
     }
      if(email===""){
        throw new ApiError(400,"email is required")
     }
      if(userName===""){
        throw new ApiError(400,"username is required")
     }
      if(password===""){
        throw new ApiError(400,"password is required")
     }
   const existedUser=await User.findOne({
        $or:[{userName},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }
  const avatarLocalPath= req.files?.avatar?.[0]?.path;
  let coverImageLocalPath
  //const coverImageLocalPath=req.files?.coverImage?.[0]?.path;
  if(req.files && Array.isArray(req.files.coverImage
  ) && req.files.coverImage.length>0 ){
    coverImageLocalPath=req.files.coverImage[0].path
  }
  
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
  }
 const avatar= await uploadOnCloudinary(avatarLocalPath)
 const coverImage= await uploadOnCloudinary(coverImageLocalPath)
  if(!avatar){
      throw new ApiError(400,"Avatar file is required")
  }
 const user=await User.create({
   fullName,
   avatar:avatar.url,
   coverImage:coverImage?.url||"",
   email,
   password,
   userName:userName.toLowerCase()

  })
const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
)
if(!createdUser){
    throw new ApiError(500,"something went wrong while registering the user")
}
return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
)

})
const loginUser=asyncHandler(async(req,res)=>{
    //from reqbody we need to take usernmae/eamil and password;
    //we will validate usr
    //we will match our password
    // if password is valid we send cookies to the user or acesstokenn
    const {userName,email,password}=req.body
    if(!userName && !email){
      throw new ApiError(400,"userName/Email is required");
    }
      
    const user=await User.findOne({
     $or:[{userName},{email}]
    })
    if(!user){
      throw new ApiError(404,"user not found with such credentials");
    }
   const isPasswordcorrect= await user.isPasswordCorrect(password);
   if(!isPasswordcorrect){
    throw new ApiError(404,"password is wrong");
   }
   const{accessToken,refreshToken}=await generateAccesstokenansRefreshToken(user._id)
   const loggedinUser=await User.findById(user._id).select("-password-refreshToken");
  const options={
    httpOnly:true,
    secure:true
  }
  return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
          new ApiResponse(
           200,
           {
           user: loggedinUser,accessToken,refreshToken
           },
           "User logged in sucessfully"
          )
        )

})
const logoutUser=asyncHandler(async(req,res)=>{
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set:{
            refreshToken:undefined
          }
        },
        {
          new:true
        }
      )
      const options={
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(
    new ApiResponse(200,{},"User loggedout")
  )

})
 


export{registerUser,loginUser,logoutUser}