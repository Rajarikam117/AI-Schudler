import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { readDb, updateDb } from '../storage/database.js';
import { httpError } from '../middleware/errorHandler.js';
const router=Router();
const priorities=['Low','Medium','High','Critical'];
function validate(body, partial=false){
 if(!body||typeof body!=='object'||Array.isArray(body))throw httpError(400,'Request body must be a JSON object.');
 const out={};
 if(!partial||'title'in body){if(typeof body.title!=='string'||!body.title.trim()||body.title.trim().length>160)throw httpError(400,'Title is required and must be 1–160 characters.');out.title=body.title.trim();}
 for(const k of ['description','notes','category'])if(k in body){if(typeof body[k]!=='string'||body[k].length>(k==='description'?2000:1000))throw httpError(400,`${k} must be text within the allowed length.`);out[k]=body[k].trim();}
 if('priority'in body){if(!priorities.includes(body.priority))throw httpError(400,'Priority must be Low, Medium, High, or Critical.');out.priority=body.priority;}
 if('estimatedDuration'in body){const n=Number(body.estimatedDuration);if(!Number.isInteger(n)||n<5||n>720)throw httpError(400,'Estimated duration must be between 5 and 720 minutes.');out.estimatedDuration=n;}
 for(const k of ['date','deadline'])if(k in body){if(body[k]!==''&&body[k]!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(body[k]))throw httpError(400,`${k} must use YYYY-MM-DD format.`);out[k]=body[k]||null;}
 for(const k of ['startTime','endTime'])if(k in body){if(body[k]!==''&&body[k]!==null&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(body[k]))throw httpError(400,`${k} must use HH:MM 24-hour format.`);out[k]=body[k]||null;}
 if('status'in body){if(!['pending','completed'].includes(body.status))throw httpError(400,'Status must be pending or completed.');out.status=body.status;}
 if('dependencies'in body){if(!Array.isArray(body.dependencies)||body.dependencies.length>30||body.dependencies.some(x=>typeof x!=='string'))throw httpError(400,'Dependencies must be an array of task IDs.');out.dependencies=body.dependencies;}
 if('date'in out&&out.date&&Number.isNaN(Date.parse(`${out.date}T00:00:00Z`)))throw httpError(400,'Invalid task date.');
 if(out.startTime&&out.endTime&&out.startTime>=out.endTime)throw httpError(400,'Start time must be earlier than end time.');
 return out;
}
router.get('/',async(req,res)=>{const db=await readDb();res.json({tasks:db.tasks});});
router.post('/',async(req,res)=>{const data=validate(req.body);const now=new Date().toISOString();const task={id:randomUUID(),title:data.title,description:data.description||'',notes:data.notes||'',category:data.category||'General',priority:data.priority||'Medium',estimatedDuration:data.estimatedDuration||30,date:data.date||null,startTime:data.startTime||null,endTime:data.endTime||null,deadline:data.deadline||null,status:'pending',dependencies:data.dependencies||[],createdAt:now,updatedAt:now};await updateDb(db=>{db.tasks.push(task);});res.status(201).json({task});});
router.get('/:id',async(req,res)=>{const db=await readDb();const task=db.tasks.find(t=>t.id===req.params.id);if(!task)throw httpError(404,'Task not found.');res.json({task});});
router.put('/:id',async(req,res)=>{const data=validate(req.body,true);const task=await updateDb(db=>{const t=db.tasks.find(t=>t.id===req.params.id);if(!t)throw httpError(404,'Task not found.');Object.assign(t,data,{updatedAt:new Date().toISOString()});return t;});res.json({task});});
router.delete('/:id',async(req,res)=>{const removed=await updateDb(db=>{const i=db.tasks.findIndex(t=>t.id===req.params.id);if(i<0)throw httpError(404,'Task not found.');return db.tasks.splice(i,1)[0];});res.json({deleted:true,task:removed});});
router.patch('/:id/status',async(req,res)=>{const body=validate(req.body);const task=await updateDb(db=>{const t=db.tasks.find(t=>t.id===req.params.id);if(!t)throw httpError(404,'Task not found.');t.status=body.status;t.updatedAt=new Date().toISOString();return t;});res.json({task});});
export default router;
