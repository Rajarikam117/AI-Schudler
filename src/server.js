import 'dotenv/config';
import fs from 'node:fs'; import dotenv from 'dotenv';
if(fs.existsSync('.env.local'))dotenv.config({path:'.env.local',override:false});
// Express 4 does not forward rejected async route handlers to error middleware by itself.
import 'express-async-errors';
import express from 'express';import path from 'node:path';import{fileURLToPath}from'node:url';import rateLimit from'express-rate-limit';
import tasksRouter from './routes/tasks.js';import schedulesRouter from './routes/schedules.js';import aiRouter from './routes/ai.js';import preferencesRouter from './routes/preferences.js';import{notFound,errorHandler}from'./middleware/errorHandler.js';import{readDb}from'./storage/database.js';
const __dirname=path.dirname(fileURLToPath(import.meta.url));const app=express();const port=Number(process.env.PORT)||3000;
app.disable('x-powered-by');app.use(express.json({limit:'64kb'}));
const aiLimiter=rateLimit({windowMs:60_000,limit:10,standardHeaders:true,legacyHeaders:false,message:{error:'Rate limit exceeded',message:'Please wait a minute before making more AI requests.'}});
app.get('/api/health',async(req,res)=>{const db=await readDb();res.json({status:'ok',app:'AI Scheduler',time:new Date().toISOString(),taskCount:db.tasks.length});});
app.use('/api/tasks',tasksRouter);app.use('/api/schedules',schedulesRouter);app.use('/api/ai',aiLimiter,aiRouter);app.use('/api/preferences',preferencesRouter);
app.use(express.static(path.resolve(__dirname,'../public'),{extensions:['html']}));app.use('/api',notFound);app.use((req,res)=>res.sendFile(path.resolve(__dirname,'../public/index.html')));app.use(errorHandler);
const server=app.listen(port,()=>console.log(`AI Scheduler running at http://localhost:${port}`));
function shutdown(){server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();}process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
export {app,server};