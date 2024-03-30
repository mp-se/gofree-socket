<template>
  <div class="container">
    <h1>Gofree Tier 2 API Explorer</h1>

    <div class="row">
      <p>Software for interacting with the GoFree Tier 2 API on B&G Multi Function Displays (MFD) such as Lowrance,
        Simrad etc. This exposes most of the NMEA2000 data that is on your boat network. The specification can be found
        here: <a
          href="https://softwaredownloads.navico.com/Lowrance/FTP/Lowrance_Software%20-%20Copy/BG_Documents/GoFree-Tier2-Toolkit-(view-only).pdf">GoFree
          Tier 2 Specification</a></p>
      <p>
        You can can find the MFD IP under the settings -> network option. URL format is 'ws://your-ip:2053'
      </p>
      <p>
        Note! This app needs to be loaded via http:// or it will not be allowed to connect with the MFD.
      </p>
    </div>

    <div class="row">
      <div class="col-sm-2">
        <button class="btn btn-primary" type="button" @click=connect() :disabled="socket == null ? false : true">Open
          Socket</button>
      </div>
      <div class="col-sm-3">
        <input v-model="url" type="text" class="form-control" :disabled="socket == null ? false : true">
      </div>
      <div class="col-sm-7">
        <button class="btn btn-secondary" type="button" @click="reqDataList()">DataList</button>&nbsp;
        <button class="btn btn-secondary" type="button" @click="reqFilterDataList()">Filter Options</button>&nbsp;
        <button class="btn btn-secondary" type="button" @click="clearSerial()">Clear Output</button>&nbsp;
        <button class="btn btn-secondary" type="button" @click="fetchAll()">Fetch all values</button>&nbsp;
        <button class="btn btn-secondary" type="button" @click="clipboard()">Copy clipboard</button>&nbsp;
      </div>
    </div>

    <div class="row">
      <div class="col-sm-6">
        <p></p>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="" v-model="showRaw">
          <label class="form-check-label" for="flexCheckDefault">
            Show raw packet data
          </label>
        </div>
      </div>
    </div>

    <hr>

    <div class="row">
      <div class="col-sm-2">
        <select v-model="selectedCat" class="form-select">
          <option v-for="cat in dataCategoryList" :key="cat" :value="cat">{{ cat }}</option>
        </select>

      </div>
      <div class="col-sm-4">
        <select v-model="selectedData" class="form-select">
          <option v-for="data in filteredDataList" :key="data.value" :value="data.value">{{ data.label }}</option>
        </select>
      </div>

      <div class="col-sm-2">
        <input v-model="selectedData" type="text" class="form-control">
      </div>

      <div class="col-sm-3">
        <button class="btn btn-secondary" type="button" @click="reqDataInfo()">Req: DataInfo</button>
        &nbsp;
        <button class="btn btn-secondary" type="button" @click="reqData()">Req: Data</button>
      </div>
    </div>
    <hr>

    <pre id="serial">{{ serial }}</pre>
    <hr>
    <div class="row">
      <p>(c) 2024 Magnus Persson</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { dataList } from '@/gofree.js'
 
const props = defineProps(['App'])
const socket = ref(null)
const serial = ref("Socket not connected\n")
const maxLines = 500
const showRaw = ref(false)
const filterInvalid = ref(false)
const selectedCat = ref("GPS")
const selectedData = ref("1")
const url = ref("ws://192.168.1.123:2053")
const dataCategoryList = ref([]) // This will be created based on data list
const filteredDataList = computed(() => {
  var list = []
  var found = false

  for (var i = 0; i < dataList.value.length; i++) {
    if (dataList.value[i].category === selectedCat.value && dataList.value[i].valid) {
      if (dataList.value[i].value == selectedData.value)
        found = true
      list.push(dataList.value[i])
    }
  }

  if (!found && list.length > 0) {
    selectedData.value = list[0].value
  }

  // console.log("Filtered data list", list, selectedData.value, found)
  return list
})


function filterCategories() {
  var cat = []

  for (var i = 0; i < dataList.value.length; i++) {
    if (dataList.value[i].valid) {
      if (!cat.includes(dataList.value[i].category, 0)) {
        cat.push(dataList.value[i].category)
      }
    }
  }

  dataCategoryList.value = cat
}

onMounted(() => {
  if(window.location.href.startsWith("https://"))
    serial.value += "App cannot be loaded via https since that will block access to MFD"

  filterCategories()
})

function clearSerial() {
  serial.value = "Output cleared\n"
}

function reqFilterDataList() {
  filterInvalid.value = true
  serial.value += "Filtering out invalid options\n"
  send('{"DataListReq":{"group":1}}')
}

function fetchAll() {
  serial.value += "Fetching all available data\n"

  for (var i = 0; i < dataList.value.length; i++) {
    var instance = 0
    send('{"DataReq":[{"id":' + dataList.value[i].value + ',"repeat":false,"inst":' + instance + '}]}')
  }
}

function reqDataList() {
  filterInvalid.value = false
  serial.value += "Requesting available options\n"
  send('{"DataListReq":{"group":1}}')
}

function reqData() {
  var repeat = false
  var instance = 0
  send('{"DataReq":[{"id":' + selectedData.value + ',"repeat":' + repeat + ',"inst":' + instance + '}]}')
}

function reqDataInfo() {
  send('{"DataInfoReq":[' + selectedData.value + ']}')
}

function send(message) {
  if (socket.value) {
    // console.log("Sending data: " + message)
    socket.value.send(message + '\r\n')
  } else {
    serial.value += "Not connected\n"
  }
}

function socketCallback(data) {
  var json = JSON.parse(data)
  // console.log(json)

  if (json.Data !== undefined)
    callbackData(json)
  else if (json.DataInfo !== undefined)
    callbackDataInfo(json)
  else if (json.DataList !== undefined)
    callbackDataList(json)
}

function callbackData(json) {
  /* If the data is invalid we remove it from the list of options */
  if (filterInvalid.value) {
    for (var j = 0; j < json.Data.length; j++) {
      if (!json.Data[j].valid) {
        for (var i = 0; i < dataList.value.length; i++) {
          if (dataList.value[i].value == json.Data[j].id) {
            dataList.value[i].valid = false
            // console.log("Disable value: ", dataList.value[i].label)
          }
        }
      }
    }
    filterCategories()
  }

  /* Display the value received */
  for (var j = 0; j < json.Data.length; j++) {
    for (var i = 0; i < dataList.value.length; i++) {
      if (dataList.value[i].value == json.Data[j].id && json.Data[j].valid) {
        serial.value += dataList.value[i].value + " - " + dataList.value[i].category + " - " + dataList.value[i].label + ": " + json.Data[j].valStr.replace('&deg;', '°') + " " + dataList.value[i].unit + "\n"
      }
    }
  }

}

function callbackDataInfo(json) {
  /* Save the unit for the data type */
  for (var j = 0; j < json.DataInfo.length; j++) {
    for (var i = 0; i < dataList.value.length; i++) {
      if (dataList.value[i].value == json.DataInfo[j].id) {
        dataList.value[i].unit = json.DataInfo[j].unit.replace('&deg;', '°')
        serial.value += "Using unit " + dataList.value[i].unit + " for " + dataList.value[i].label + "\n"
      }
    }
  }
}

function callbackDataList(json) {
  var list = json.DataList.list

  for (var i = 0; i < list.length; i++) {
    var found = false

    for (var j = 0; j < dataList.value.length; j++) {
      if (list[i] === dataList.value[j].value)
        found = true
    }

    if (!found) {
      serial.value += "Data " + list[i] + " not found in specification, requesting info!\n"
      send('{"DataInfoReq":[' + list[i] + ']}')
    }

    /* Send a request for data so we can check if it has a valid value (= is used) */
    if (filterInvalid.value) {
      var instance = 0
      send('{"DataReq":[{"id":' + list[i] + ',"repeat":false,"inst":' + instance + '}]}')
      send('{"DataInfoReq":[' + list[i] + ']}')
    }
  }
}

function clipboard() {
  var text = document.getElementById("serial").innerHTML
  console.log(text)
  navigator.clipboard.writeText(text);
}

function connect() {
  serial.value += "Connecting...\n"

  socket.value = new WebSocket(url.value)

  socket.value.onopen = function (e) {
    // console.log("Websocket established")
    serial.value = "Socket open\n"
  }

  socket.value.onmessage = function (event) {
    // console.log("Websocket receive: " + event)
    var list = serial.value.split("\n");
    while (list.length > maxLines)
      list.shift();
    serial.value = list.join('\n');

    if (showRaw.value)
      serial.value += event.data + '\n'

    socketCallback(event.data)
  }

  socket.value.onclose = function (event) {
    // console.log("Websocket close: " + event)

    serial.value += "Socket closed\n"
    socket.value = null
  }

  socket.value.onerror = function (event) {
    serial.value += "Failed to connect with MFD\n"
  }
}
</script>
