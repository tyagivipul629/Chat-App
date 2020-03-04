var zerorpc=require("zerorpc");
var client=new zerorpc.Client();
client.connect("tcp://127.0.0.1:1100");
client.invoke("vigenere_encrypt","my name is vipul tyagi and i live in muradnagar and i study in kiet and it is a very good place to be at and i am a very cool person","yhgrti",function(err,res,more){
	console.log(res);
});
