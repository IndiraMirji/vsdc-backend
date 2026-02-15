const express = require("express");
const router = express.Router();
const moment = require("moment");
const Attendance = require("../models/attendance.models.js");
const Staff = require("../models/staff.models");
const staffRoute = require("../routes/staff.routes.js");
const attendanceRoute = require("../routes/attendance.routes.js");
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
router.use(authMiddleware);

//get tody's attendance summary
router.get("/today/summary", authMiddleware,async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendance = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate("staffId", "name staffId department sundayDuty");

    const onLeave = attendance.filter((a) => a.status === "Leave");
    const present = attendance.filter((a) => a.status === "Present");

    //get staff with sunday duty
    // const isSunday = today.getDay() === 0;
    const isSunday = true; 
    let sundayDutyStaff = [];

    if (isSunday) {
      sundayDutyStaff = await Staff.find({ sundayDuty: true, isActive: true });
    }

    res.json({
      date: startOfDay,
      isSunday,
      onLeave: onLeave.map((a) => ({
        ...a.toObject(),
      })),
      present: present.map((a) => ({
        ...a.toObject(),
      })),
      sundayDutyStaff,
      stats: {
        totalPresent: present.length,
        totalLeave: onLeave.length,
        totalAbsent: attendance.filter((a) => a.status === "Absent").length,
        totalHalfDay: attendance.filter((a) => a.status === "Halfday").length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//getting attendance for a specific date
router.get("/date/:date", authMiddleware,async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    const attendance = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate("staffId", "name staffId");

const recordsWithPermissions = attendance.map(rec => ({
      ...rec.toObject(),
      canModify: rec.canModify() 
    }));

    res.json(recordsWithPermissions);

   
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// mark attendance
router.post("/", authMiddleware,adminOnly,async (req, res) => {
  try {
    const { staffId, date, status, checkInTime, checkOutTime } = req.body;
    console.log(req.body);

    const existingAttendance = await Attendance.findOne({
      staffId,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    });

    if (existingAttendance) {
      return res.status(400).json({ message: "Attendance already marked" });
    }

    const attendance = new Attendance({
      staffId,
      date: new Date(date),
      status,
      checkInTime,
      checkOutTime,
      markedAt: new Date(),
    });

    await attendance.save();
    const populatedAttendance = await Attendance.findById(
      attendance._id,
    ).populate("staffId", "name department");
    res.status(201).json({
      message: "Attendance Marked Successfully",
      attendance: {
        ...populatedAttendance.toObject(),
        canModify: populatedAttendance.canModify(),
      },
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error marking attendance", error: error.message });
  }
});

//update Attendance
router.put("/:id", authMiddleware,adminOnly,async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    if (!attendance.canModify()) {
      return res.status(403).json({
        message: "Cannot Modify after 1 hour",
        lockedAt: attendance.markedAt,
      });
    }
    const { status, checkInTime, checkOutTime } = req.body;
    if (status) attendance.status = status;
    if (status === "Absent" || status === "Leave") {
      attendance.checkInTime = "";
      attendance.checkOutTime = "";
    } else {
      if (checkInTime !== undefined) attendance.checkInTime = checkInTime;
      if (checkOutTime !== undefined) attendance.checkOutTime = checkOutTime;
    }
    await attendance.save();
    const updatedAttendance = await Attendance.findById(
      attendance._id,
    ).populate("staffId", "name staffId");
    res.json({
      message: "Attendance marked successfully",
      attendance: {
        ...updatedAttendance.toObject(),
        canModify: updatedAttendance.canModify(),
      },
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating attendance", error: error.message });
  }
});


//get monthly report 
router.get("/report/monthly", authMiddleware,async(req,res) => {
  try{
    const { year,month } = req.query;
    const startDate = new Date(year, month-1,1);
    const endDate = new Date(year, month, 0,23,59,59);
    const attendance = await Attendance.find({
      date: {$gte:startDate, $lte:endDate}
    }). populate("staffId","name staffId department");
    const report = {};
    attendance.forEach(record =>{
      const staffId = record.staffId._id.toString();
      if(!report[staffId]){
        report[staffId] ={
          staff:record.staffId,
          present:0,
          absent:0,
          leave:0,
          halfday:0
        };
      }
      switch(record.status){
        case "Present":
          record[staffId].present++;
          break;
        case "absent":
          record[staffId].absent++;
          break;
        case "leave":
          record[staffId].leave++;
          break;
        case "halfday":
          record[staffId].halfday++;
          break;
      }
    });
    res.json(Object.values(report));
  } catch(error){
res.json(500).json({message:"Server error", error:error.message})
  }
})

//history for staff member
router.get("/staff/:staffId", authMiddleware,async(req,res) =>{
  try{
    const { startDate, endDate} = req.query;
    const filter = {staffId:req.params.staffId};
    if(startDate && endDate){
      filter.date = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate(),
      };
    }
    const attendance = await Attendance.find(filter).sort({date:-1}).populate("staffId","name staffId department");
    return res.json(attendance);
  } catch(error){
    console.error(error);
res.json(500).json({message:"Server error",error:error.message});
  }
})

module.exports = router;
