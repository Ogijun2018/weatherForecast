function unixTime2jst(intTime, select){
  var d = new Date( intTime * 1000 );
  var month = d.getMonth() + 1;
  var day  = d.getDate();
  var hour = ( d.getHours()   < 10 ) ? '0' + d.getHours()   : d.getHours();
  var min  = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : d.getMinutes();
  var sec   = ( d.getSeconds() < 10 ) ? '0' + d.getSeconds() : d.getSeconds();
  
  if(select == "hms") return (hour + ':' + min + ':' + sec );
  if(select == "mdh") return (month + "/" + day + " " + hour);
};

function postResult(text){
  var res = { text: text };
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function makeTextArray(targetArray){
  var text = "";
  text += "-----------------------------------------\n";
  text += "     　　     ＊" + unixTime2jst(targetArray.time, "mdh") + ":00＊\n";
  text += "気温: " + targetArray.temperature + "℃\n";
  text += "降水確率: " + targetArray.precipProbability * 100 + "%\n";
  text += "降水量: " + targetArray.precipIntensity + "mm/h\n";
  text += "風速: " + targetArray.windSpeed + "m/s\n";
  text += "-----------------------------------------\n";
  return text;
}
  

function doPost(e){
  var parameter = e.parameter.text;
  var now = new Date();
  
  var url = "https://api.darksky.net/forecast/SAMPLESAMPLESAMPLESAMPLE/SAMPLE,SAMPLE?lang=ja&units=si"
  var response = UrlFetchApp.fetch(url);

  var json = JSON.parse(response.getContentText());
  var res;
  var text = "";
  
  if(parameter.match(/td/)){
    //今日の天気
    var Time = parameter.slice(2);
    //3文字以上かつ"-"があるときは範囲選択
    if(Time.length > 2 && Time.match(/-/)){
      var splitTime = Time.split("-");
      var subHour = splitTime[0] - now.getHours();
      var term = splitTime[1] - splitTime[0];
      if(splitTime[0] >= 24 || splitTime[1] >= 24){
        return postResult('日付をまたぐ場合はtdとtmを使って別々に実行してください');
      }else if(subHour < 0){
        return postResult('過去は出力できません');
      }
      for(var i=0; i < term + 1; i++){
        var targetArray = json["hourly"]["data"][subHour + i];     
        text += makeTextArray(targetArray);
      }
      return postResult(text);
    }else{
      //指定された時間1時間分の予報を出す部分
      var subHour = Time - now.getHours();
      if(Time >= 24){
        return postResult('24時を超える場合はtmを指定してください');
      }else if(subHour < 0){
        return postResult('過去は出力できません');
      }
      var targetArray = json["hourly"]["data"][subHour];
      return postResult(makeTextArray(targetArray));
    }
  }else if(parameter.match(/dtm/)){
    //明後日の天気を調べる
    var Time = parameter.slice(3);
    var todayLeftTime = 24 - now.getHours();
    if(Time.length > 2){
      var splitTime = Time.split("-");
      var subHour = 24 + parseInt(todayLeftTime) + parseInt(splitTime[0]);
      var term = splitTime[1] - splitTime[0];
      if(subHour > 48){
        return postResult('48時間を超える予報は出せません!');
      }
      for(var i=0; i < term + 1; i++){
        var targetArray = json["hourly"]["data"][subHour + i];
        text += makeTextArray(targetArray);
      }
      return postResult(text);
    }else{
      //指定された時間1時間分の予報を出す部分
      var subHour = 24 + parseInt(todayLeftTime) + parseInt(Time);
      if(subHour > 48){
        return postResult('48時間を超える予報は出せません!');
      }
      var targetArray = json["hourly"]["data"][subHour];
      return postResult(makeTextArray(targetArray));
    }
  }else if(parameter.match(/tm/)){
    //明日の天気を調べる
    var Time = parameter.slice(2);
    var todayLeftTime = 24 - now.getHours();
    
    if(Time.length > 2){
      var splitTime = Time.split("-");
      var subHour = parseInt(todayLeftTime) + parseInt(splitTime[0]);
      var term = splitTime[1] - splitTime[0];
      if(splitTime[0] >= 24 || splitTime[1] >= 24){
        return postResult('日付をまたぐ場合はtmとdtmを使って別々に実行してください');
      }
      for(var i=0; i < term + 1; i++){
        var targetArray = json["hourly"]["data"][subHour + i];
        text += makeTextArray(targetArray);
      }
      return postResult(text);
    }else{
      //指定された時間1時間分の予報を出す部分
      var subHour = parseInt(todayLeftTime) + parseInt(Time);
      if(Time >= 24){
        return postResult('24時を超える場合はdtmを指定してください');
      }
      var targetArray = json["hourly"]["data"][subHour];
      return postResult(makeTextArray(targetArray));
    }
  }else{
    if(parameter > 48){
      return postResult('48時間以上後の予報は見れません!');
    }else if(parameter < 0){
      return postResult('過去にとらわれるな…!');
    }else if(isNaN(parseInt(parameter))){
      return postResult('数字を入れてください!!');
    }
    var targetArray = json["hourly"]["data"][parameter];
    return postResult(makeTextArray(targetArray));
  }
};

function myFunction() {
  var url = "https://api.darksky.net/forecast/SAMPLESAMPLESAMPLESAMPLE/SAMPLE,SAMPLE?lang=ja&units=si"
  var response = UrlFetchApp.fetch(url);

  var json = JSON.parse(response.getContentText());
  var text = "";
  var dailyData = json["daily"]["data"][0];
  var hourlyData;
  
  text += "・今日の天気: " + dailyData.summary + "\n";
  text += "・日没時刻: " + unixTime2jst(dailyData.sunsetTime, "hms") + "\n\n";
  
  for(var i = 4; i < 8; i ++){
    hourlyData = json["hourly"]["data"][i];
    
    text += "     　　     ＊" + unixTime2jst(hourlyData.time, "mdh") + ":00＊\n";
    text += "気温: " + hourlyData.temperature + "℃\n";
    text += "降水確率: " + hourlyData.precipProbability + "%\n";
    text += "降水量: " + hourlyData.precipIntensity + "mm/h\n";
    text += "風速: " + hourlyData.windSpeed + "m/s\n";
    text += "-----------------------------------------\n";
  }

  var data={
    "text": text,
    "icon_emoji": ":" + dailyData.icon + ":",
    "username": "今日のお空はどんな空？",
  };
  
  var options =
  {
  "method" : "POST",
  'contentType': 'application/json',
  'payload' : JSON.stringify(data),
  };
  // SlackのIncoming WebhookのURLを取得して入力
  UrlFetchApp.fetch("https://hooks.slack.com/services/SAMPLESAMPLESAMPLE/SAMPLESAMPLESAMPLE", options);
}