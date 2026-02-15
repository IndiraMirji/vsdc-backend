const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    staffId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Staff",
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    status:{
        type:String,
        required:true,
        enum:["Present","Absent","Leave","Halfday"]
    },
    checkInTime:{
        type:String
    },
    checkOutTime:{
        type:String
    },
    markedAt:{
        type:Date,
        default:Date.now
    },
    isLocked:{
        type:Boolean,
        default:false
    },
    lockedAt:{
        type:Date
    }
    }, 
    { 
        timestamps:true
});

attendanceSchema.index({ staffId:1, date:1}, {unique:true});


//autolock method
attendanceSchema.methods.canModify = function() {
    if(!this.markedAt) return true;
    const hoursSinceMarked = (Date.now() - this.markedAt.getTime())/(1000*60*60);
    return hoursSinceMarked < 1;
};

attendanceSchema.pre("save", function(next){
    if(!this.markedAt){
        return next();
    }
    const hoursSinceMarked = (Date.now() - this.markedAt.getTime())/(1000*60*60);

    if(hoursSinceMarked >= 1 && !this.isLocked){
        this.isLocked = true;
        this.lockedAt = new Date();
    }
    // next();
})


module.exports = mongoose.model("Attendance", attendanceSchema);