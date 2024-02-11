/* 2023-07-28 13:01:03 
Effect: 
· If the policy group node changes, the result will be re-cached and re-valued. 
· If a node occasionally fails to ping, there is a high probability that it will not be selected. 
· If a node has low latency but Even if the speed is very poor, we will not choose him. 

Strategy: 
· Select nodes based on the node speed and delay (persistent cache) returned by the api. 

Panel description: 
· Inheritance: Tokyo: 40C 6.54M 61 [Tokyo] represents the preferred node, [ 40C] represents the number of times, [6.54M] represents the maximum speed, [61] represents the comprehensive score that changes non-linearly according to speed and delay. 
  GroupAuto VPS'4 17:41 [VPS] represents the preferred policy group name ['4] represents the policy group There are 4 nodes in 

# Required parameters: 
# group= your policy group name (you need to fill in the manually selected policy group select) 

# Optional parameters: 
# timeout=6000 unit ms maximum value 9900 Surge Httpapi is limited to 10s, which is 10000ms 
# tolerance=10 The tolerance is 10ms. If the tolerance is less than 10ms, the node will not be switched. 
# timecache=18 The cache expiration time (hours) or the old data will be cleared if it exceeds 66 times. 
# avgnumber=30 The number of cache node tests. If it exceeds, it will be cleared. 
# push parameters are Turn on the notification, no notification will be given if no parameters are added 
#!name=GroupAuto 
#!desc=Prefer nodes based on the nodes returned by the api (speed: non-linear weight of persistent cache) and (delay: persistent cache) 

[Panel] 
GroupAuto = script-name=GroupAuto,update-interval=3 

[Script] 
# Panel operation (panel and scheduled tasks can exist at the same time) 
GroupAuto = type=generic,timeout=3,script-path=https://github.com/Keywos /rule/raw/main/JS/ProGroup.js,argument=group=VPS&tolerance=15&timecache=18&color=#6699FF&icon=speedometer 
# Automatically run at scheduled times (optional to cancel # comment) once every 30 minutes, not running from 2 to 7 o'clock every day 
# Cron_GroupAuto = type=cron, cronexp= "0/30 0,1,7-23 * * *", timeout=15,wAllKeye-system=0,script-path=https://raw.githubusercontent.com/Keywos /rule/main/JS/ProGroup.js, argument=tolerance=10&timecache=18&group=Proxy 

exception: If you encounter problems, Surge needs to enter [Script Editor] → lower left corner [Settings] → [$persistentStore] [KEY_Group_Auto] to delete the cache data. 
*/ 

let Groupkey = "VPS", tol = "10", th = "18",avgn = "30",isLs=0, fgf = "''", push = false, icons= "",icolor=" ",debug=1; 
if (typeof $argument !== "undefined" && $argument !== "") { 
  const ins = getin("$argument"); 
  Groupkey = ins.group || Groupkey; 
  th = ins .timecache || th; 
  tol = ins.tolerance || tol; 
  push = ins.push || 0; 
	debug = ins.debug || 0; 
  icons = ins.icon || icons; 
  icolor = ins.color || icolor ; 
  avgn = ins.avgnumber || avgn; 
} 


function httpAPI(path = "", method = "GET", body = null ) { 
  return new Promise((resolve) => { 
    $httpAPI(method, path, body, ( result) => { 
      resolve(result); 
    }); 
  }); 
} 

function getin() { 
  return Object.fromEntries( 
    $argument.split("&").map((i) => i.split("= ")) 
    .map(([k, v]) => [k,decodeURIComponent(v)]) 
  ); 
} 

function BtoM(i) { 
  var bytes = i / (1024 * 1024); 
  if (bytes < 0.01) {return "0.01MB";} 
  return bytes.toFixed(2) + "MB "; 
} 
function reSpeed(x, y) {
  if (x > 1e7) { 
    return Math.floor(y * 0.6); 
  } else{ 
  const t = x /2e7; 
  const ob = 0.99 * Math.exp(-t); 
  return Math.floor(y * ob); 
  } 
} 

// Node data class 
class NodeStats { 
  constructor(name) { 
    this.name = name; 
    this.se = 0; 
    this.sum = 0; 
	this.sumse = 0; 
    this.count = 0; 
    this.avg = 0 ; 
    this.sek = 0; 
  } 
  
  collect(records) { 
    for (let record of records) { 
      if (record.name === this.name) { 
        this.count++; 
        const counts = this.count; 
        this.sum += record.ms; 
        this.se = record.se; 
		this.sumse += record.se; 
        const tmpAvg = Math.floor(this.sum / counts); 
		const seAvg = Math.floor( this.sumse / counts); 
        this .avg = tmpAvg; 
        this.sek = reSpeed(seAvg, tmpAvg); 
      } 
    } 
  } 
} 

function getUnia(e){ 
  e++ 
  return e 
} 

function getUni(x) { 
  let xhUni; 
  let outUni; 
  do { 
    xhUni = Math.floor( Math.random() * (0x2679 - 0x2673 + 1)) + 0x2673; 
    outUni = String.fromCodePoint(xhUni); 
  } while (x == outUni); 
  return outUni; 
} 


function NodeData(records) { 
  const nodes = {} ; 
  for (let record of Object.values(records)[0]) { 
    nodes[record.name] = new NodeStats(record.name); 
  } 
  for (let record of Object.values(records)) { 
    for (let node of Object.values(nodes)) { 
      node.collect(record); 
    } 
  } 
  return nodes; 
} 


(async () => { 
  try { 
    const proxy = await httpAPI("/v1/policy_groups"); 
    if (!Object. keys(proxy).includes(Groupkey)) { 
      throw new Error("The group parameter does not enter the correct policy group")} 
    const Pleng = Object.keys(proxy[Groupkey]).length+" ";// Number of nodes 
    const NowNodeolicy = await httpAPI(`/v1/policy_groups/select?group_name=${encodeURIComponent(Groupkey)}`); 
		// const NowNodeolicy = $surge.selectGroupDetails().decisions[Groupkey]; 
    let NowNode,resMS,logday=false ,logKey="",endDay="",Pushs="",newp="",CC ="",UC="C"; 
      if (NowNodeolicy) NowNode = NowNodeolicy.policy; 
    const Protest = await httpAPI("/ v1/policy_groups/test","POST",(body = { group_name:Groupkey })); 
      if (Protest){ 
				fgf = "'";
        if (!NowNodeolicy) NowNode = Protest.available[0]; 
      } 
      if (!NowNode) {throw new Error("Unable to obtain speed test results or policy group information")} 
      // console.log(NowNode) 

    const testGroup = await httpAPI ("/v1/policies/benchmark_results"); 
      // name and lineHash in /v1/policy_groups 
      resMS = proxy[Groupkey].map((i) => { 
        const lineHash = i.lineHash; 
        const name = i.name ; 
        // lastTestScoreInMS of /v1/policies/benchmark_results is ms 
        let HashValue = testGroup[lineHash]; 
        if (!HashValue) { 
          HashValue = { lastTestScoreInMS: 6996 }; 
        } else if ( HashValue.lastTestScoreInMS === -1 ) { 
          isLs++ ; 
          HashValue.lastTestScoreInMS = 6666; 
        } 
        const HashMs = HashValue ? HashValue.lastTestScoreInMS : 5678; 
        return { name, ms: HashMs, lineHash }; 
      }); 
    if ( isLs == Pleng ){ 
      throw new Error(Groupkey+" policy group all Node Ping failed, please check the configuration") 
    } 
    const Sproxy = await httpAPI("/v1/traffic"); 
      const { connector } = Sproxy; 
      const IOM = {}; // inMaxSpeed ​​outMaxSpeed ​​Max 
      if (Sproxy.connector) { 
        Object .keys(connector).forEach((key) => { 
        const { inMaxSpeed, outMaxSpeed, lineHash } = connector[key]; 
          if (lineHash && inMaxSpeed) { 
            IOM[lineHash] = inMaxSpeed ​​+ outMaxSpeed; 
          }           
        }); 
      } 
    resMS .forEach((i) => {let lineHash = i.lineHash; 
      if (lineHash in IOM) {i.se = IOM[lineHash];} else {i.se = 0;}delete i.lineHash;}); 
    // console.log(resMS); 
    // Read and write cleaning exceeds the number of timestamp cache 
    const nowDay = new Date(); 
    const tc = nowDay.getTime(); 
    const readData = $persistentStore.read("KEY_Group_Auto"); 
      let k = readData ? JSON.parse(readData) : {}; 
      k[Groupkey] = k[Groupkey] || {}; 
			const getFunUn = getUni(k['Unicode']) || "♴"; 
      let ccKey = getUnia(k['ccKey']) || 1, dayKey; 
      (ccKey % 10 === 0) && (logday=true) 
      if (!k['dayKey']) { 
        nowDay.setHours(nowDay.getHours() );//+8 
        dayKey = String(nowDay.toISOString().slice(0, 10)); 
        k['dayKey'] = dayKey;logday=true; 
      } else { 
        dayKey = k['dayKey']; 
      } 
      
      let timeNms = Object.keys(k[Groupkey]).length; 
      for (const t in k[Groupkey]) { 
        if (timeNms > (avgn-1)) {
          delete k[Groupkey][t]; 
          timeNms--; 
          UC = " "+getFunUn; 
        } 
      } 
    if (Object.values(k[Groupkey])[0]) { 
      const groupValues ​​= Object.values(k[Groupkey]) [0]; 
      if (groupValues.some((i) => !resMS.some((e) => e.name === i.name)) || resMS.some((i) => !groupValues. some((e) => e.name === i.name))) { 
          k[Groupkey] = {};logday=true; 
          newp="\nData changes, clear cache!"; 
        } 
    } 
    k[Groupkey ][tc] = resMS; 
    Object.keys(k).forEach((ig) => {const y = k[ig]; 
      Object.keys(y).forEach((e) => { 
        const t = tc - parseInt(e); 
        const o = t/(36e5 * th); 
        if (o>1) {           
          delete y[e]; 
        }}); 
    }); 
		k['Unicode'] = getFunUn; 
    k['ccKey' ] = ccKey; 
    $persistentStore.write(JSON.stringify(k), "KEY_Group_Auto"); 
    // console.log(k[Groupkey]) 
    const AllKey = NodeData(k[Groupkey]); // Function processing 
    const minKey = Object.values(AllKey).map((n) => n.sek);// [] 
    const minAvg = Math.min(...minKey);// Optimal score 
    const minValue = Object.keys(AllKey) .find((name) => AllKey[name].sek === minAvg);//Get the corresponding node name 
    const NowNodesek = AllKey[NowNode].sek;//Current node score 
    
    if(logday){ 
      endDay = Math .floor((nowDay - new Date(dayKey)) / (864e5)); 
      logKey = `Run ${endDay} days since ${dayKey.slice(2, 10)}: ${ccKey} times`; 
    } 
    if ( NowNode === minValue ) { 
      Pushs ="Inherited: "+minValue +": "+minAvg; 
      CC = BtoM(AllKey[minValue]["se"])+" "+AllKey[minValue]["count" ] 
    } else if (NowNodesek - minAvg > tol) { 
      const selectGroup = $surge.setSelectGroupPolicy(Groupkey,minValue) 
      if (!selectGroup) await httpAPI("/v1/policy_groups/select","POST",(body = {group_name : Groupkey, policy: minValue })); 
        Pushs ="Preferred: "+minValue+": "+minAvg; 
        CC = BtoM(AllKey[minValue]["se"])+" "+AllKey[minValue]["count" ] 
    } else { 
      Pushs ="Tolerance: "+NowNode+": "+NowNodesek; 
      CC = BtoM(AllKey[NowNode]["se"])+" "+AllKey[NowNode]["count"] 
    } 
    const xt = Groupkey +fgf+Pleng+CC+UC; 
    const xc = Pushs+newp; 
    // console.log(AllKey) 
    console.log("\n"+logKey+"\n"+xt+"\n"+xc); 
    push && $notification.post(xt,xc,logKey); 
		debug && (console.log(resMS), 
		console.log(JSON.stringify(AllKey, null, 2))) 

    $done({ 
      title: xt, 
      content: xc,
      icon: icons, 
      'icon-color': icolor 
    }); 

  } catch (error) { 
    const err = 'Feedback @𝙺𝚎𝚢 !! '; 
    console.log(err+error.message) 
    push && $notification.post(err, error.message,""); 
    $done({title:err, content:error.message}) 
  } 
})();
