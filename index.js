const env_id = "YourEnvId"
const url = "https://tcb-api.tencentcloudapi.com/web?env=" + env_id
const date = new Date();
const time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
async function get_refresh_token(){
	/*第一步获得refresh_token*/
    const step_1_body = {
        action: "auth.signInAnonymously",
        anonymous_uuid: "",
        dataVersion: time,
        env: env_id,
        refresh_token: "",
        seqId: ""
    }
    const step_1 = {
        body: JSON.stringify(step_1_body),
        method: "POST",
        headers: {
            "content-type": "application/json;charset=UTF-8"
        }
    }
    /*refresh_token到手*/
	return JSON.parse(await (await fetch(url, step_1)).text())["refresh_token"]
}
async function get_access_token(refresh_token){
	const step_2_body = {
        action: "auth.fetchAccessTokenWithRefreshToken",
        anonymous_uuid: "",
        dataVersion: time,
        env: env_id,
        refresh_token: refresh_token,
        seqId: ""
    }
    const step_2 = {
        body: JSON.stringify(step_2_body),
        method: "POST",
        headers: {
            "content-type": "application/json;charset=UTF-8"
        }
    }
    /*access_token到手*/
	return JSON.parse(await (await fetch(url, step_2)).text())["access_token"];
}
async function get_comment(access_token,path,before){
	
    const re_data = { "event": "COMMENT_GET", "url": path,"before":before}
    const step_3_body = {
        access_token: access_token,
        action: "functions.invokeFunction",
        dataVersion: time,
        env: env_id,
        function_name: "twikoo",
        request_data: JSON.stringify(re_data),
        seqId: ""
    }
    const step_3 = {
        body: JSON.stringify(step_3_body),
        method: "POST",
        headers: {
            "content-type": "application/json;charset=UTF-8"
        }
    }
	return (await (await fetch(url, step_3)).text())
	
}
async function handleRequest(request) {
    const req = await JSON.parse(await request.text())
    const path = req["path"]
    const before = req["before"]
	let refresh_token= await KVNAME.get("hpp_comment_refresh_token")
    let access_token= await KVNAME.get("hpp_comment_access_token")
    let val = await get_comment(access_token,path,before)
    if(await JSON.parse(val)['code']=='CHECK_LOGIN_FAILED'){
        refresh_token = await get_refresh_token()
        await KVNAME.put("hpp_comment_refresh_token",refresh_token)
        access_token = await get_access_token(refresh_token)
		await KVNAME.put("hpp_comment_access_token",access_token)
        val= await get_comment(access_token,path,before)
    }
    return new Response(val, {
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    }
    )

}
addEventListener("fetch", event => {
    return event.respondWith(handleRequest(event.request))
})
