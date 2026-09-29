import { NextRequest, NextResponse } from 'next/server';
import { db, identity } from '@/lib/backend';
import { randomUUID } from 'node:crypto';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');if(!origin||new URL(origin).host!==req.headers.get('host'))return NextResponse.json({error:'Origine refusée'},{status:403});
 try{
 const user=await identity();if(!user)return NextResponse.json({error:'Connexion requise'},{status:401});
 const form=await req.formData();const file=form.get('file');if(!(file instanceof File)||file.size>1500000)throw new Error('Image limitée à 1,5 Mo.');
 const bytes=Buffer.from(await file.arrayBuffer());
 const mime=bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a'?'image/png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'?'image/webp':null;
 if(!mime)throw new Error('Utilisez une image PNG, JPEG ou WebP.');
 await db.execute('CREATE TABLE IF NOT EXISTS stocky_media(id TEXT PRIMARY KEY,owner TEXT NOT NULL,mime TEXT NOT NULL,data BLOB NOT NULL)');
 const id=randomUUID();await db.execute({sql:'INSERT INTO stocky_media(id,owner,mime,data) VALUES(?,?,?,?)',args:[id,String(user.id),mime,bytes]});
 return NextResponse.json({url:'/api/media?id='+id});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Échec upload'},{status:400})}
}
export async function GET(req:NextRequest){try{const id=req.nextUrl.searchParams.get('id');if(!id)return new NextResponse(null,{status:404});const result=await db.execute({sql:'SELECT mime,data FROM stocky_media WHERE id=?',args:[id]});const file=result.rows[0];if(!file)return new NextResponse(null,{status:404});return new NextResponse(file.data as ArrayBuffer,{headers:{'Content-Type':String(file.mime),'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}})}catch{return new NextResponse(null,{status:404})}}
