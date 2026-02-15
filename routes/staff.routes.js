const express = require("express");
const router = express.Router();
const Staff = require("../models/staff.models");
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
router.use(authMiddleware);

//create new staff number
router.post("/",authMiddleware,adminOnly,async (req,res)=> {
    try{
        const staff = new Staff(req.body);
        await staff.save();
        res.status(201).json({message:"Staff member added successfully", staff});
    } catch(error){
        if(error.code === 11000){
            return res.status(400).json({message:"Staff Id or email already exits"});
        }
        res.status(400).json({message:"Error creating staff member", error:error.message});
    }
});

//to get all staff members 
router.get("/", authMiddleware,async(req,res) =>{
    try{
        const {isActive, sundayDuty} = req.query;
        const filter = {};

        if(isActive !== undefined) filter.isActive = isActive === "true";
        if(sundayDuty !== undefined) filter.sundayDuty = sundayDuty === "true";

        const staff = await Staff.find(filter).sort({createdAt: -1});
        res.status(200).json(staff);
    } catch(error){
        res.status(500).json({message:"Error fetching staff"});
    }
});

//get single staff member
router.get("/:id", authMiddleware,async(req,res) => {
    try{
        const staff = await Staff.findById(req.params.id);
        if(!staff){
            return res.status(404).json({ message: 'Staff member not found' });
        }
        res.json(staff);
    } catch(error){
         res.status(500).json({ message: 'Server error', error: error.message });
    }
});

//updating staff
router.put("/:id", authMiddleware,adminOnly,async(req,res) => {
    try{
        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true, runValidators:true}
        );
        if(!staff){
            return res.status(404).json({message: "Staff member not found"});
        }
       res.json({message:"Staff member updated successfully",staff});
    } catch(error){
        if(error.code === 11000){
            return res.status(400).json({message:"emploee id or email already exists"});
        }
        res.status(400).json({messae:"Error updating staff member", error:error.message});
    } 
});

//delete staff member
router.delete("/:id", authMiddleware,adminOnly, async(req,res) => {
    try{
        const staff = await Staff.findByIdAndDelete(req.params.id);
        if(!staff){
           return res.status(404).json({ message: 'Staff member not found' });
        }
        res.json({ message: 'Staff member deactivated successfully', staff });
    } catch(error){
         res.status(500).json({ message: 'Server error', error: error.message });
    }
});

//sunday duty
router.patch("/:id/sundayDuty", authMiddleware,adminOnly,async(req,res) => {
    try{
        const staff = await Staff.findById(req.params.id);
        if(!staff){
            return res.status(404).json({ message: 'Staff member not found' });
        }
        staff.sundayDuty = !staff.sundayDuty;
        await staff.save();
        res.json({ message: 'Sunday duty updated successfully', staff });
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;