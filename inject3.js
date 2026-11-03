(function () {
  'use strict';
  var W = window;
  var D = document;

  D.body.innerHTML = "<div style='text-align:center;margin-top:50px;font-family:sans-serif;'><h2 style='color:#0f766e;'>tb任务</h2><p id='status' style='color:#666;'>等待粘贴...</p></div><input id='query' style='width:90%;margin:20px auto;display:block;padding:10px;border:1px solid #ccc;' />";
  var statusEl = D.getElementById('status');
  var queryInput = D.getElementById('query');

  // 核心动作1：强制让输入框获得焦点，准备接收电脑的“粘贴”指令
  setTimeout(function() {
      queryInput.focus();
  }, 500);

  // 核心动作2：监听输入框，一旦电脑端粘贴了内容，立刻触发搜索
  queryInput.addEventListener('input', function() {
      var q = queryInput.value.trim();
      if (!q) return;
      statusEl.innerText = "已收到标题：" + q;
      statusEl.style.color = "green";
      
      // 触发自动搜索
      runTask(q);
  });

  function mtopSend(api, param, version) {
    return new Promise(function (resolve, reject) {
      if (!W.__windvane__ || !W.__windvane__.call) { reject('no bridge'); return; }
      var p = { api: api, v: version || '1.0', post: '1', type: '', isHttps: '0', ecode: '0',
        isSec: '0', param: param, timer: 30000, needLogin: true, sessionOption: 'AutoLoginOnly', ext_headers: {}, ext_querys: {} };
      W.__windvane__.call('MtopWVPlugin.send', p, resolve, reject, 10000);
    });
  }

  function buildSearchParam(query) {
    return { q: query, appId: '66', sversion: '29.9', spm: 'a2141.1.searchbar.searchbox', scm: '1007.home_topbar.searchbox.d',
      search_action: 'initiative', from: 'nt_history', sugg: '_0_1', index: '0', vm: 'nw', schemaType: 'auction',
      style: 'list', isEnterSrpSearch: 'true', needTabs: 'true', searchBoxShowType: 'UOne', layeredSrp: 'true',
      tb2025: 'true', ShopSDKModuleType: 'local', grayHair: 'false', elderHome: 'false', searchElderHomeOpen: 'false',
      homePageVersion: 'v7', enablePicShot: 'true', isBeta: 'false', gpsEnabled: 'false', history_query_from: 'suggest_all-queryBE2', extra_data_key: 's.m.taobao.com/h5entry', mainChannel: '' };
  }

  function buildDetailParam(itemId) {
    var ex = { NAV_PROCESSOR_START_TIME: "1761720138804", appReqFrom: "detail", bizName: "minidetail", container_type: "sku",
      countryCode: "CN", cpuCore: "8", cpuMaxHz: "null", deviceLevel: "medium", dinamic_v3: "true", dynamicJsonData: "true",
      finalUltron: "true", from: "minidetail", identifier: "", industryMainPicDegrade: "false", isFoldDevice: "false",
      isPadDevice: "false", isPrefetchSkuMtop: "false", itemId: itemId, item_id: itemId, latitude: "0", liveAutoPlay: "true",
      longitude: "0", newStruct: "true", nick: "", openFrom: "tbmessage", osVersion: "34", phoneType: "OPPO11",
      preload_v: "industry", screenHeight: "2606", screenWidth: "1240", skuId: "null", skuOutSdk: "true", skuType: "confirm",
      sku_forbidH5: "true", sku_forbidH5_toast: "该商品不支持聊天窗内选择规格", soVersion: "2.0", sourceType: "3", "spm-cnt": "a2141.1007.41750.336411",
      supportIndustryMainPic: "true", transparent_key: "openFrom,itemId,identifier,bizName,sourceType,sku_forbidH5,sku_forbidH5_toast,from,skuId",
      ttd_ttid: "10001201@tt_detail_android_12.51.40", ultron2: "true", utdid: "b5eAIejvgwsCAbRmgzU4VyYm", videoAutoPlay: "true" };
    return { detail_v: "3.3.2", exParams: JSON.stringify(ex), id: itemId };
  }

  function runTask(title) {
      statusEl.innerText = "正在搜索：" + title;
      
      mtopSend('mtop.relationrecommend.MtopRecommend.recommend', buildSearchParam(title)).then(function(r) {
          statusEl.innerText = "搜索成功，正在提取目标...";
          
          // 简单解析列表，直接取第一个商品（通常排第一的就是我们找的）
          var targetId = "";
          try {
              var data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
              var arr = data.itemsArray || data.items || data.auctions || [];
              if (arr.length > 0) targetId = String(arr[0].item_id || arr[0].nid || arr[0].auctionId);
          } catch(e) {}
          
          if (!targetId) {
              statusEl.innerText = "未搜到商品！";
              statusEl.style.color = "red";
              return;
          }
          
          statusEl.innerText = "正在拉取详情...";
          mtopSend('mtop.taobao.detail.data.get', buildDetailParam(targetId)).then(function(res) {
              statusEl.innerText = "抓取成功！正在发送给电脑...";
              statusEl.style.color = "green";
              // 核心动作3：将数据打印到日志，供电脑端 logcat 截获
              var payload = { itemId: targetId, alldetail: res };
              console.log("TASK_DATA_START::" + JSON.stringify(payload) + "::TASK_DATA_END");
          }).catch(function (e) {
              statusEl.innerText = "详情抓取失败。";
          });
          
      }).catch(function(e) {
          statusEl.innerText = "搜索失败。";
      });
  }
})();