/*
**autor Joshua Fei Shen
**Date 6 Dec 2013
*/
function initCPU(){
	for (name in reg){
	$("#RM").append("<tr id="+name+"><td class=rName>"+name+"</td><td class=\"resetable d32\">"+reg[name].valD+"</td><td class=\"resetable b32\">"+reg[name].valB+"</td></tr>");
	}
}
function loadcode(){
	program_done=false;
	//reset reg
	for (var i in reg){
		reg[i].valD=0;
		reg[i].valB="00000000000000000000000000000000";	
	}
	$("tr").remove(".removable");
	$(".resetable.d32").each(function(){
		$(this).text("0000000000")
	});
	$(".resetable.b32").each(function(){
		$(this).text("00000000000000000000000000000000")
	});
	resetMemStyle();
	im=new Object();//instruction mem
	dm=new Object();//d-mem
	//no pipline logs
	nopip=new Object();
	for (var opcd in opcode){
		nopip[opcd]={
			'count':0,
			'cycle':opcode[opcd].cc
		}
	}
	//
	//initiate pipeline memory
	pip=[];
	//
	
	code=$("#input").val().split("\n");
	var imAddr=4*Math.round(Math.random()*536870912);//random start address from first half of 0 to 2^30 *4bit
	reg.pc.valD=imAddr;
	reg.pc.valB=toBinU(imAddr,32);
	updateRM("pc");

	var dmAddr=4*Math.round((1+Math.random())*536870912);
	for(var i in code){
		code[i]=code[i].trim().toLowerCase();
		if(code[i]=="") continue;
		if(code[i].charAt(0)=='.'){//variable declaration
			var tmp=code[i].split("=");
			var var_name=tmp[0].replace(/./,"");
			dm[dmAddr]={
				"name":var_name,
				"addr_d":dmAddr,
				"addr_b":toBinU(dmAddr,32),
				"val_d":tmp[1],
				"val_b":toBin(tmp[1],32)
			};
			$("#DM").append("<tr class=removable id="+dmAddr+"><td class=\"addr b32\">"+dm[dmAddr].addr_b+"</td><td class=\"bin b32\">"+dm[dmAddr].val_b+"</td><td class=\"dec d32\">"+dm[dmAddr].val_d+"</td></tr>");
			dmAddr+=4;
			continue;
		}
		if(code[i].charAt(0)=="@"){//label line
			var tmp=code[i].split(":");
			var label=tmp[0].replace(/@/,"");
			dm[dmAddr]={
				"name":label,
				"addr_d":dmAddr,
				"addr_b":toBinU(dmAddr,32),
				"val_d":imAddr,
				"val_b":toBinU(imAddr,32)
			};
			$("#DM").append("<tr class=removable id="+dmAddr+"><td class=\"addr b32\">"+dm[dmAddr].addr_b+"</td><td class=\"bin b32\">"+dm[dmAddr].val_b+"</td><td class=\"dec d32\">"+dm[dmAddr].val_d+"</td></tr>");
			dmAddr+=4;
			if(tmp[1]=='') continue;//only label this line
			code[i]=tmp[1];
		}
		im[imAddr]=new Object();
		im[imAddr].addr_d=imAddr;
		im[imAddr].addr_b=toBinU(im[imAddr].addr_d,32);
		im[imAddr].code=code[i];
		var line=code[i].split(" ");
		im[imAddr].opcode=line[0];
		im[imAddr].opcode_b=opcode[line[0]].opcode;
		var oprands=line[1].split(",");
		im[imAddr].oprand=[];
		im[imAddr].oprand[0]={};
		im[imAddr].oprand[1]={};
		im[imAddr].oprand[2]={};
		im[imAddr].oprand[0].n=oprands[0];
		im[imAddr].oprand[1].n=oprands[1]=='undefined'? "":oprands[1];
		im[imAddr].oprand[2].n=oprands[2]=='undefined'? "":oprands[2];
		for (var ii=0;ii<3;ii++){
			switch (opcode[line[0]].oprand[ii].type){
				case "$"://reg
				im[imAddr].oprand[ii].b=reg[oprands[ii]].addr;break;
				case "#"://signed
				im[imAddr].oprand[ii].b=toBin(oprands[ii],opcode[line[0]].oprand[ii].bit);break;
				case "##"://unsigned, mem address
				im[imAddr].oprand[ii].b=toBinU(oprands[ii],opcode[line[0]].oprand[ii].bit);break;
				case "null":
				im[imAddr].oprand[ii].b=toBin(0,opcode[line[0]].oprand[ii].bit);break;
				
			}
			im[imAddr].code_b=im[imAddr].opcode_b+im[imAddr].oprand[0].b+im[imAddr].oprand[1].b+im[imAddr].oprand[2].b+opcode[line[0]].shift_bit;
		}		
		$("#IM").append("<tr class=removable id="+im[imAddr].addr_d+"><td class=\"address b32\">"+im[imAddr].addr_b+"</td><td class=\"value b32\">"+im[imAddr].code_b+"</td></tr>");
		imAddr+=4;
	}
}

function toBinU(int,bit){//unsign to bin
	if (bit==0) return "";
	if (int>2147483647) return "1"+toBin(int-2147483648,bit-1);
	else return toBin(int,bit);
}
function toBin(int,bit){//sign to bin
	int=parseInt(int,10);
	if (bit==0) return "";
	if (int<0){
		int=int>>>0;
		//return (Array(bit).join("1")+int.toString(2)).slice(-bit);//fill with 1
	}

		return (Array(bit).join("0")+int.toString(2)).slice(-bit);//fill with 0

}
function updateRM(name){
	name=name.toString();
	$("#"+name+" .d32").text(reg[name].valD);
	$("#"+name+" .b32").text(reg[name].valB);
	$("#"+name).css({"background-color":"#DDD","color":"#000"});
}
function updateDM(addr){
	addr=addr.toString();
	var tmp=$("#DM #"+addr).text();
	if (tmp==''||tmp=='undefined'){
		$("#DM").append("<tr class=removable id="+addr+"><td class=\"addr b32\">"+dm[addr].addr_b+"</td><td class=\"bin b32\">"+dm[addr].val_b+"</td><td class=\"dec d32\">"+dm[addr].val_d+"</td></tr>");
	}
	else{
		$("#DM #"+addr+" .addr").text(dm[addr].addr_b);
		$("#DM #"+addr+" .bin").text(dm[addr].val_b);
		$("#DM #"+addr+" .dec").text(dm[addr].val_d);
	}
	$("DM #"+addr).css({"background-color":"#DDD","color":"#000"});
}
function markIM(addr){
	$("#IM tr").css({"background-color":"#333","color":"#FFF"});
	$("#IM tr#"+addr).css({"background-color":"#DDD","color":"#000"});
}
function markDM(addr){
	$("#DM tr#"+addr).css({"background-color":"#DDD","color":"#000"});
}
function resetMemStyle(){
	//reset mem style
	$("#RM tr").css({"background-color":"#333","color":"#FFF"});
	$("#DM tr").css({"background-color":"#333","color":"#FFF"});
}
function runNext(){
	if (program_done===true){
		return alert("Program already finish!");		
	}
	resetMemStyle();
	reg.ir.valD=parseIntS(im[reg.pc.valD].code_b);
	reg.ir.valB=im[reg.pc.valD].code_b;
	updateRM("ir");
	//set nPC
	reg.np.valD=reg.pc.valD+4;
	reg.np.valB=toBinU(reg.np.valD,32);
	updateRM("np");
	//execute instruction at PC
	markIM(reg.pc.valD);
	var oprd1=im[reg.pc.valD].oprand[0].n;
	var oprd2=im[reg.pc.valD].oprand[1].n;
	var oprd3=im[reg.pc.valD].oprand[2].n;
	//nopip logs
	nopip[im[reg.pc.valD].opcode].count++;
	//pipeline logs
	pip.push('0 '+im[reg.pc.valD].code);//0 skip byte for branch predict taken
	
	
	switch(im[reg.pc.valD].opcode){
		case 'syscall':
			switch(im[reg.pc.valD].oprand[0].n){
				case '0':
				program_done=true;
				return ;
				case '1':
				break;
			}
			break;
		
		case 'add':
			reg[oprd1].valD=reg[oprd2].valD+reg[oprd3].valD;
			reg[oprd1].valB=toBin(reg[oprd1].valD,32);
			updateRM(oprd1);
			break;
		case 'addi':
			oprd3=parseInt(oprd3);
			if (isNaN(oprd3)) oprd3=0;
			reg[oprd1].valD=reg[oprd2].valD+oprd3;
			reg[oprd1].valB=toBin(reg[oprd1].valD,32);
			updateRM(oprd1);
			break;
		case 'sub':
			reg[oprd1].valD=reg[oprd2].valD-reg[oprd3].valD;
			reg[oprd1].valB=toBin(reg[oprd1].valD,32);
			updateRM(oprd1);
			break;
		case 'subi':
			oprd3=parseInt(oprd3);
			if (isNaN(oprd3)) oprd3=0;
			reg[oprd1].valD=reg[oprd2].valD-oprd3;
			reg[oprd1].valB=toBin(reg[oprd1].valD,32);
			updateRM(oprd1);
			break;
		case 'div':
			reg.lo.valD=reg[oprd1].valD%reg[oprd2].valD;
			reg.hi.valD=(reg[oprd1].valD-reg.lo.valD)/reg[oprd2].valD;
			reg.hi.valB=toBin(reg.hi.valD,32);
			reg.lo.valB=toBin(reg.lo.valB,32);	
			updateRM("hi");
			updateRM("lo");
			break;
		case 'mul':
			var tmp=reg[oprd1].valD*reg[oprd2].valD;
			tmp=toBin(tmp,64);		
			reg.hi.valB=tmp.slice(0,32);
			reg.lo.valB=tmp.slice(32,64);
			reg.hi.valD=parseIntS(reg.hi.valB);
			reg.lo.valD=parseIntS(reg.lo.valB);
			updateRM("hi");
			updateRM("lo");
			break;
		case 'load':
			var tmp=reg[oprd2].valD+parseInt(oprd3,10);
			reg.lm.valD=dm[tmp].val_d;
			reg.lm.valB=dm[tmp].val_b;
			reg[oprd1].valD=reg.lm.valD;
			reg[oprd1].valB=reg.lm.valB;
			updateRM('lm');
			updateRM(oprd1);
			break;
		case 'lui':
			oprd2=(oprd2)<<16;
			reg[oprd1].valD=oprd2;
			reg[oprd1].valB=toBinU(oprd2,32);
			updateRM('lm');
			updateRM(oprd1);
			break;
		case 'ori':
			var tmp=reg[oprd1].valD;
			tmp=tmp|(oprd2);
			reg[oprd1].valD=tmp;
			reg[oprd1].valB=toBinU(tmp,32);
			updateRM(oprd1);
			break;
		case 'store':
			var addr=parseInt(reg[oprd2].valD,10)+parseInt(oprd3,10);
			dm[addr]={
				"name":"",
				"addr_d":addr,
				"addr_b":toBinU(addr,32),
				"val_d":reg[oprd1].valD,
				"val_b":reg[oprd1].valB
			};
			updateDM(addr);
			break;
		case 'jez':
			if (reg[oprd1].valD==0){
				reg.np.valD+=parseInt(oprd2)<<2;
				reg.np.valB=toBinU(reg.np.valD,32);
				updateRM('np');
			}else{
				pip.push('1 '+im[reg.np.valD+(parseInt(oprd2)<<2)].code);
			}
			break;
		case 'jnz':
			if (reg[oprd1].valD!=0){
				reg.np.valD+=parseInt(oprd2)<<2;
				reg.np.valB=toBinU(reg.np.valD,32);
				updateRM('np');
			}
			else{
				pip.push('1 '+im[reg.np.valD+(parseInt(oprd2)<<2)].code);
			}
			break;
		case 'jgz':
			if (reg[oprd1].valD>0){
				reg.np.valD+=parseInt(oprd2)<<2;
				reg.np.valB=toBinU(reg.np.valD,32);
				updateRM('np');
			}else{
				pip.push('1 '+im[reg.np.valD+(parseInt(oprd2)<<2)].code);
			}
			break;
		case 'jgez':
			if (reg[oprd1].valD>=0){
				reg.np.valD+=parseInt(oprd2)<<2;
				reg.np.valB=toBinU(reg.np.valD,32);
				updateRM('np');
			}else{
				pip.push('1 '+im[reg.np.valD+(parseInt(oprd2)<<2)].code);
			}
			break;
		case 'jlz':
			if (reg[oprd1].valD<0){
				reg.np.valD+=parseInt(oprd2)<<2;
				reg.np.valB=toBinU(reg.np.valD,32);
				updateRM('np');
			}else{
				pip.push('1 '+im[reg.np.valD+(parseInt(oprd2)<<2)].code);
			}
			break;
		case 'jlez':
			if (reg[oprd1].valD<=0){
				reg.np.valD+=parseInt(oprd2)<<2;
				reg.np.valB=toBinU(reg.np.valD,32);
				updateRM('np');
			}else{
				pip.push('1 '+im[reg.np.valD+(parseInt(oprd2)<<2)].code);
			}
			break;
		case 'jr':
			reg.np.valD=parseInt(reg[oprd1].valD);
			reg.np.valB=reg[oprd1].valB;
			updateRM('np');
			break;
		case 'j':
			reg.np.valD=parseInt(reg[oprd1].valD)<<2|reg.pc.valD>>>30<<30;
			reg.np.valB=toBinU(reg.np.valD,32);
			updateRM('np');
			break;
		case 'mfhi':
			reg[oprd1].valD=reg.hi.valD;
			reg[oprd1].valB=reg.hi.valB;
			updateRM(oprd1);
			break;
		case 'mflo':
			reg[oprd1].valD=reg.lo.valD;
			reg[oprd1].valB=reg.lo.valB;
			updateRM(oprd1);
			break;
		case 'call':
			break;
		case 'return':
			break;	
	}

	//
	reg.pc.valD=reg.np.valD;
	reg.pc.valB=reg.np.valB;
	updateRM("pc");
}
function advNPC(addr){
	reg.np.valD+=4;
	reg.np.valB=toBinU(reg.np.valD,32);
	updateRM("np");
}
function isBranch(opcd){
	return (/^(jez|jnz|jgez|jgz|jlz|jlez)$/).test(opcd);
}
function isJmp(opcd){
	return (/^(jr|j|call|return)$/).test(opcd);
}
function parseIntS(bin){//parse signed int from bin to dec
	bin=bin.toString();
	if (bin.charAt(0)==1)
		return parseInt(bin,2)-Math.pow(2,bin.length);
	return parseInt(bin,2);
}
function runAll(){
	while(true){
		if (program_done===true) {
			alert('Finish');
			break;
		}
		runNext();
	}
}
function about(){
	alert($('meta[name=author]').attr('content')+'\r'+$('meta[name=date]').attr('content')+'\rjQuery v2.0.3\rjCanvas v13.11.21');
}
function noPipeline(){
	//write logs to local Storage
	if(typeof(Storage)==="undefined"){
	  // localStorage and sessionStorage not support!
		alert('storage not supported, change ur browser');
	  	return;
	 }
	localStorage.clear();
	for (var opcd in opcode){
		localStorage[opcd]=nopip[opcd].count+' '+nopip[opcd].cycle;
	}
	window.open('nopipeline.html','Without pipeline','width=400px,height=535px,status=no,toolbar=no,menubar=no,location=no,top=100px,left=200px');
	
}
function pipeline(){
	if(typeof(Storage)==="undefined"){
	  // localStorage and sessionStorage not support!
		alert('storage not supported, change ur browser');
	  	return;
	 }
	localStorage.clear();
	localStorage.pip=pip.join('|');
	window.open('pipeline.html','Pipeline','width=1000px,height=500px,status=no,toolbar=no,menubar=no,location=no,top=10px,left=10px');
	
	
}