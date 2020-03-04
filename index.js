var express = require('express');var app=express();
//var Math=require('Math');
var zerorpc=require('zerorpc');
const client=new zerorpc.Client();
client.connect("tcp://127.0.0.1:1100");
var path=require('path');
var session=require('express-session');
var mongoose =require('mongoose');
const options=require('./mongo.js');
var bodyParser = require('body-parser');
var http=require('http').createServer(app);
var io=require('socket.io')(http);
var socketid="";
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(__dirname+'/public'));
app.set('view engine','ejs');
app.use(session({
        secret : "secret_password",
        resave : true,
        saveUninitialized : true
}));
mongoose.connect("mongodb://52.14.161.145/maindatabase?authSource=admin",options)
.then()
.catch((err)=>console.log("could not connect:",err));
const schema=mongoose.Schema;
const nameSchema=new schema({
        username: String,
        password: String,
        socketId: String
},{collection:"useraccount"});
const detail=mongoose.model('useraccount',nameSchema);
function makeid(length) {
   var result           = '';
   var characters       = 'abcdefghijklmnopqrstuvwxyz';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
app.get('/', function(req, res){
   res.sendFile(path.join(__dirname+'/login.html'));
});
io.of("/user").on('connection',function(socket){
       
        socketid=socket.id;
        var user=socket.handshake.query.loggeduser;
   
        detail.findOneAndUpdate({"username":user},{$set:{"socketId":socket.id}},{new:true},function(err,doc)
                {
        if(err) console.log(err);
          });

socket.on('chat message',function(msg){
        console.log(msg);
	detail.find({"username":msg.id},function(err,result){
		if(err) console.log("user not exists");
	else{if(msg.algo=="vigenere"){
		client.invoke(msg.algo+'_encrypt',msg.msg,makeid(6),function(err,res,more){
	console.log(res);
		client.invoke(msg.algo+'_decrypt',res,function(err,res1,more){
			let message={
			message:res1,
			sender:msg.sender}
			console.log(message);
        socket.broadcast.to(result[0].socketId).emit('chat message',message);});
});
		
	}
else{
		client.invoke(msg.algo+'_encrypt',msg.msg,function(err,res,more){
	console.log(res);
		client.invoke(msg.algo+'_decrypt',res,function(err,res1,more){
			let message={
			message:res1,
			sender:msg.sender}
			console.log(message);
        socket.broadcast.to(result[0].socketId).emit('chat message',message);});
});}
}	});
	
	});
});

app.post('/signup',function(req, res){
                console.log(req.body);
                var usernm=req.body.usrnm;
                var passwd=req.body.passwrd;
                var objmsg={};

        detail.findOne({username:usernm},(err,data)=>{
                if(err) throw err;
                else if(!data){
                        var credentials=new detail({
                                username: usernm,
                                password: passwd,
                                socketId: socketid
                        });
                        credentials.save().then().catch(err=>{console.error(err);});
                        objmsg.status="successfull";objmsg.message="Signed Up Successfully";
                        res.send(JSON.stringify(objmsg));
                }
                else{
                        objmsg.status="failed";objmsg.message="Account already exists!";
                                                res.send(JSON.stringify(objmsg));
                }
        });
});
app.post('/userlogin',function(req,res){
        var username=req.body.usrnm;
        var password=req.body.passwrd;
        //console.log(password);
        var obj={};
        detail.findOne({username:username,password:password},function(err,data){
                if(err) throw err;
                else if(!data){
                        obj.status='failed';obj.message='email/password is wrong!';
                        res.send(JSON.stringify(obj));
                }
                else{
                        req.session.loggedin=true;
                        req.session.username=username;
                        obj.status="success";obj.link="/dashboard/";
                        res.send(JSON.stringify(obj));
                }
        });
});
app.get('/dashboard',function(req, res){
        if(req.session.loggedin!=true){
               return res.redirect('/');
                res.end();
        }
        else{


                        return res.render('dashboard',{username: req.session.username});
                        res.end();
        }
});
http.listen(3000);

