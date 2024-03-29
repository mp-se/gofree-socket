<template>
  <div class="container">
    <h1>Gofree Tier 2 API Explorer</h1>

    <div class="row">
      <p>Software for interacting with the GoFree API on B&G Multi Function Displays (MFD) such as Lowrance, Simrad etc.
        This
        exposes most of the NMEA2000 data that is on your boat network. The specification can be found here: <a
          href="https://softwaredownloads.navico.com/Lowrance/FTP/Lowrance_Software%20-%20Copy/BG_Documents/GoFree-Tier2-Toolkit-(view-only).pdf">GoFree
          Tier 2 Specification</a></p>
      <p>
        You can can find the MFD IP under the settings -> network option. URL format is 'ws://your-ip:2053'
      </p>
      <p>
      </p>
    </div>

    <div class="row">
      <div class="col-sm-2">
        <button class="btn btn-primary" type="button" @click=connect()>Open
          Socket</button>
      </div>
      <div class="col-sm-4">
        <input v-model="url" type="text" class="form-control">
      </div>
      <div class="col-sm-6">
        <button class="btn btn-secondary" type="button" @click="reqDataList()">DataList</button>&nbsp;
        <button class="btn btn-secondary" type="button" @click="reqFilterDataList()">Filter Options</button>&nbsp;
        <button class="btn btn-secondary" type="button" @click="clearSerial()">Clear Output</button>&nbsp;
        <!--
        <button class="btn btn-secondary" type="button" @click="clipboard()">Copy</button>&nbsp;
        -->
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

    <pre>{{ serial }}</pre>
    <hr>
    <div class="row">
      <p>(c) 2024 Magnus Persson</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps(['App'])
const socket = ref(null)
const serial = ref("Socket not connected")
const maxLines = 500
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
const dataList = ref([
  { valid: true, category: 'GPS', label: 'Altitude', value: 1 },
  { valid: true, category: 'GPS', label: 'Position', value: 3 },
  { valid: true, category: 'GPS Status', label: 'HDOP', value: 4 },
  { valid: true, category: 'GPS Status', label: 'VDOP', value: 5 },
  { valid: true, category: 'GPS Status', label: 'TDOP', value: 6 },
  { valid: true, category: 'GPS Status', label: 'PDOP', value: 7 },
  { valid: true, category: 'GPS Status', label: 'Geoidal Seperation', value: 8 },
  { valid: true, category: 'GPS', label: 'COG', value: 9 },
  { valid: true, category: 'GPS Status', label: 'Position Quality', value: 10 },
  { valid: true, category: 'GPS Status', label: 'Position Integrity', value: 11 },
  { valid: true, category: 'GPS Status', label: 'Satellites In View', value: 12 },
  { valid: true, category: 'GPS Status', label: 'WAAS Status', value: 13 },
  { valid: true, category: 'Navigation', label: 'Bearing', value: 14 },
  { valid: true, category: 'Navigation', label: 'Course', value: 15 },
  { valid: true, category: 'Navigation', label: 'VMG to Waypoint', value: 17 },
  { valid: true, category: 'Navigation', label: 'Cross Track Error', value: 18 },
  { valid: true, category: 'Navigation', label: 'VMG to Waypoint', value: 19 },
  { valid: true, category: 'Navigation', label: 'Destination', value: 20 },
  { valid: true, category: 'Navigation', label: 'Distance to Turn', value: 21 },
  { valid: true, category: 'Navigation', label: 'Distance to Destination', value: 22 },
  { valid: true, category: 'Navigation', label: 'Time To Turn', value: 23 },
  { valid: true, category: 'Navigation', label: 'Time To Destination', value: 24 },
  { valid: true, category: 'Navigation', label: 'ETA At Turn', value: 25 },
  { valid: true, category: 'Navigation', label: 'ETA At Destination', value: 26 },
  { valid: true, category: 'Route', label: 'Total Distance', value: 27 },
  { valid: true, category: 'Navigation', label: 'Steer Arrow', value: 28 },
  { valid: true, category: 'Trip', label: 'Odometer', value: 29 },
  { valid: true, category: 'Trip', label: 'Trip Distance', value: 30 },
  { valid: true, category: 'Trip', label: 'Trip Time', value: 31 },
  { valid: true, category: 'Time', label: 'Local Date', value: 32 },
  { valid: true, category: 'Time', label: 'Local Time', value: 33 },
  { valid: true, category: 'Time', label: 'UTC Date', value: 34 },
  { valid: true, category: 'Time', label: 'UTC Time', value: 35 },
  { valid: true, category: 'Time', label: 'Local Time Offset', value: 36 },
  { valid: true, category: 'Vessel', label: 'Heading', value: 37 },
  { valid: true, category: 'Other', label: 'Voltage', value: 38 },
  { valid: true, category: 'Other', label: 'Current Set', value: 39 },
  { valid: true, category: 'Other', label: 'Current Drift', value: 40 },
  { valid: true, category: 'GPS', label: 'SOG', value: 41 },
  { valid: true, category: 'Sonar', label: 'Water Speed', value: 42 },
  { valid: true, category: 'Vessel', label: 'Pitot Speed', value: 43 },
  { valid: true, category: 'Trip', label: 'Average Trip Speed', value: 44 },
  { valid: true, category: 'Trip', label: 'Maximum Trip Speed', value: 45 },
  { valid: true, category: 'Weather', label: 'Apparent Wind Speed', value: 46 },
  { valid: true, category: 'Weather', label: 'True Wind Speed', value: 47 },
  { valid: true, category: 'Sonar', label: 'Water Temperature', value: 48 },
  { valid: true, category: 'Weather', label: 'Outside Temperature', value: 49 },
  { valid: true, category: 'Vessel', label: 'Inside Temperature', value: 50 },
  { valid: true, category: 'Engine Room', label: 'Engine Room Temperature', value: 51 },
  { valid: true, category: 'Cabin', label: 'Main Cabin Temperature', value: 52 },
  { valid: true, category: 'Live Well Tank', label: 'Live Well Temperature', value: 53 },
  { valid: true, category: 'Bait Well', label: 'Bait Well Temperature', value: 54 },
  { valid: true, category: 'Refrigerator', label: 'Refrigeration Temperature', value: 55 },
  { valid: true, category: 'Heating System', label: 'Heating System Temperature', value: 56 },
  { valid: true, category: 'Weather', label: 'Dew Point Temperature', value: 57 },
  { valid: true, category: 'Weather', label: 'Apparent Wind Chill Temperature', value: 58 },
  { valid: true, category: 'Weather', label: 'Theoretic Wind Chill Temperature', value: 59 },
  { valid: true, category: 'Weather', label: 'Heat Index Temperature', value: 60 },
  { valid: true, category: 'Freezer', label: 'Freezer Temperature', value: 61 },
  { valid: true, category: 'Engine', label: 'Engine Temperature', value: 62 },
  { valid: true, category: 'Engine', label: 'Engine Air Temperature', value: 63 },
  { valid: true, category: 'Engine', label: 'Engine Oil Temperature', value: 64 },
  { valid: true, category: 'Battery', label: 'Battery Temperature', value: 65 },
  { valid: true, category: 'Weather', label: 'Atmospheric Pressure', value: 66 },
  { valid: true, category: 'Engine', label: 'Engine Boost Pressure', value: 67 },
  { valid: true, category: 'Engine', label: 'Engine Oil Pressure', value: 68 },
  { valid: true, category: 'Engine', label: 'Engine Water Pressure', value: 69 },
  { valid: true, category: 'Engine', label: 'Engine Fuel Pressure', value: 70 },
  { valid: true, category: 'Engine', label: 'Engine Manifold Pressure', value: 71 },
  { valid: true, category: 'Other', label: 'Stream Pressure', value: 72 },
  { valid: true, category: 'Other', label: 'Compressed Air Pressure', value: 73 },
  { valid: true, category: 'Other', label: 'Hydraulic Pressure', value: 74 },
  { valid: true, category: 'Sonar', label: 'Depth', value: 77 },
  { valid: true, category: 'Sonar', label: 'Water Distance', value: 78 },
  { valid: true, category: 'Engine', label: 'Engine RPM', value: 79 },
  { valid: true, category: 'Engine', label: 'Engine Trim', value: 80 },
  { valid: true, category: 'Engine', label: 'Engine Alternator Potential', value: 81 },
  { valid: true, category: 'Engine', label: 'Engine Fuel Rate', value: 82 },
  { valid: true, category: 'Engine', label: 'Engine Percent Load', value: 83 },
  { valid: true, category: 'Engine', label: 'Engine Percent Torque', value: 84 },
  { valid: true, category: 'Engine', label: 'Suzuki Alarm Level Low', value: 85 },
  { valid: true, category: 'Engine', label: 'Suzuki Alarm Level High', value: 86 },
  { valid: true, category: 'Fuel Tank', label: 'Fuel Tank Level', value: 87 },
  { valid: true, category: 'Fresh Water Tank', label: 'Fresh Water Fluid Level', value: 88 },
  { valid: true, category: 'Gray Water Tank', label: 'Gray Water Fluid Level', value: 89 },
  { valid: true, category: 'Live Well Tank', label: 'Live Well Fluid Level', value: 90 },
  { valid: true, category: 'Oil Tank', label: 'Oil Fluid Level', value: 91 },
  { valid: true, category: 'Black Water Tank', label: 'Black Water Fluid Level', value: 92 },
  { valid: true, category: 'Fuel Tank', label: 'Fuel Remaining', value: 93 },
  { valid: true, category: 'Fresh Water Tank', label: 'Fresh Water Fluid Volume', value: 94 },
  { valid: true, category: 'Gray Water Tank', label: 'Gray Water Fluid Volume', value: 95 },
  { valid: true, category: 'Live Well Tank', label: 'Live Well Fluid Volume', value: 96 },
  { valid: true, category: 'Oil Tank', label: 'Oil Fluid Volume', value: 97 },
  { valid: true, category: 'Black Water Tank', label: 'Black Water Fluid Volume', value: 98 },
  { valid: true, category: 'Unconfigured', label: 'Generic Fluid Volume', value: 99 },
  { valid: true, category: 'Unconfigured', label: 'Generic Tank Capacity', value: 105 },
  { valid: true, category: 'Fuel Tank', label: 'Fuel Tank Capacity', value: 106 },
  { valid: true, category: 'Fresh Water Tank', label: 'Fresh Water Tank Capacity', value: 107 },
  { valid: true, category: 'Gray Water Tank', label: 'Gray Water Tank Capacity', value: 108 },
  { valid: true, category: 'Live Well Tank', label: 'Live Well Tank Capacity', value: 109 },
  { valid: true, category: 'Oil Tank', label: 'Oil Tank Capacity', value: 110 },
  { valid: true, category: 'Black Water Tank', label: 'Black Water Tank Capacity', value: 111 },
  { valid: true, category: 'Fuel Tank', label: 'Tank Fuel Used', value: 112 },
  { valid: true, category: 'Engine', label: 'Engine Fuel Used', value: 113 },
  { valid: true, category: 'Engine', label: 'Trip Fuel Used', value: 114 },
  { valid: true, category: 'Engine', label: 'Seasonal Fuel Used', value: 115 },
  { valid: true, category: 'Engine', label: 'K Value', value: 116 },
  { valid: true, category: 'Battery', label: 'Battery Potential', value: 117 },
  { valid: true, category: 'Battery', label: 'Battery Current', value: 118 },
  { valid: true, category: 'Trim Tab', label: 'Trim Tab', value: 119 },
  { valid: true, category: 'Vessel', label: 'Rate Of Turn', value: 121 },
  { valid: true, category: 'Vessel', label: 'Yaw', value: 122 },
  { valid: true, category: 'Vessel', label: 'Pitch', value: 123 },
  { valid: true, category: 'Vessel', label: 'Roll', value: 124 },
  { valid: true, category: 'Other', label: 'Magnetic Variation', value: 125 },
  { valid: true, category: 'Other', label: 'Deviation', value: 126 },
  { valid: true, category: 'Engine', label: 'Water Fuel Economy', value: 127 },
  { valid: true, category: 'Engine', label: 'GPS Fuel Economy', value: 128 },
  { valid: true, category: 'Engine', label: 'Water Fuel Range', value: 130 },
  { valid: true, category: 'Engine', label: 'GPS Fuel Range', value: 131 },
  { valid: true, category: 'Engine', label: 'Engine Hours Used', value: 132 },
  { valid: true, category: 'Engine', label: 'Engine Type', value: 133 },
  { valid: true, category: 'Vessel', label: 'Vessel Fuel Rate', value: 134 },
  { valid: true, category: 'Vessel', label: 'Vessel Water Fuel Economy', value: 135 },
  { valid: true, category: 'Vessel', label: 'Vessel GPS Fuel Economy', value: 136 },
  { valid: true, category: 'Vessel', label: 'Vessel Fuel Remaining', value: 137 },
  { valid: true, category: 'Vessel', label: 'Vessel Water Fuel Range', value: 138 },
  { valid: true, category: 'Vessel', label: 'Vessel GPS Fuel Range', value: 139 },
  { valid: true, category: 'Weather', label: 'Apparent Wind Angle', value: 140 },
  { valid: true, category: 'Weather', label: 'True Wind Angle', value: 141 },
  { valid: true, category: 'Weather', label: 'True Wind Direction', value: 142 },
  { valid: true, category: 'Vessel', label: 'Inside Humidity', value: 143 },
  { valid: true, category: 'Weather', label: 'Outside Humidity', value: 144 },
  { valid: true, category: 'Vessel', label: 'Set Humidity', value: 145 },
  { valid: true, category: 'Rudder', label: 'Rudder Angle', value: 146 },
  { valid: true, category: 'Transmission', label: 'Transmission Gear', value: 147 },
  { valid: true, category: 'Transmission', label: 'Transmission Oil Pressure', value: 148 },
  { valid: true, category: 'Transmission', label: 'Transmission Oil Temperature', value: 149 },
  { valid: true, category: 'Rudder', label: 'Commanded Rudder Angl', value: 150 },
  { valid: true, category: 'Rudder', label: 'Rudder Limit', value: 151 },
  { valid: true, category: 'Vessel', label: 'Off Heading Limit', value: 152 },
  { valid: true, category: 'Vessel', label: 'Radius of Turn Order', value: 153 },
  { valid: true, category: 'Vessel', label: 'Rate of Turn Order', value: 154 },
  { valid: true, category: 'Vessel', label: 'Off Track Limit', value: 155 },
  { valid: true, category: 'Other', label: 'Logging Time Remaining', value: 156 },
  { valid: true, category: 'GPS Status', label: 'Position Fix Type', value: 157 },
  { valid: true, category: 'Engine', label: 'Engine Discrete Status', value: 158 },
  { valid: true, category: 'Transmission', label: 'Transmission Discrete Status', value: 159 },
  { valid: true, category: 'GPS Status', label: 'GPS Best of Four Signal to Noise Ratio', value: 160 },
  { valid: true, category: 'Unconfigured', label: 'Generic Fluid Level', value: 161 },
  { valid: true, category: 'Unconfigured', label: 'Generic Pressure', value: 162 },
  { valid: true, category: 'Unconfigured', label: 'Generic Temperature', value: 163 },
  { valid: true, category: 'Other', label: 'Internal Voltage', value: 164 },
  { valid: true, category: 'Sonar', label: 'Structure Depth', value: 166 },
  { valid: true, category: 'Vessel', label: 'Loran Position', value: 167 },
  { valid: true, category: 'Vessel', label: 'Vessel Status', value: 168 },
  { valid: true, category: 'Battery', label: 'Battery DC Type', value: 169 },
  { valid: true, category: 'Battery', label: 'Battery State of Charge', value: 170 },
  { valid: true, category: 'Battery', label: 'Battery State of Health', value: 171 },
  { valid: true, category: 'Battery', label: 'Battery Time Remaining', value: 172 },
  { valid: true, category: 'Battery', label: 'Battery Ripple Voltage', value: 173 },
  { valid: true, category: 'AC Input', label: 'AC Input 1 Quality', value: 174 },
  { valid: true, category: 'AC Input', label: 'AC Input 2 Quality', value: 175 },
  { valid: true, category: 'AC Input', label: 'AC Input 3 Quality', value: 176 },
  { valid: true, category: 'AC Input', label: 'AC Input 1 Voltage', value: 177 },
  { valid: true, category: 'AC Input', label: 'AC Input 2 Voltage', value: 178 },
  { valid: true, category: 'AC Input', label: 'AC Input 3 Voltage', value: 179 },
  { valid: true, category: 'AC Input', label: 'AC Input 1 Current', value: 180 },
  { valid: true, category: 'AC Input', label: 'AC Input 2 Current', value: 181 },
  { valid: true, category: 'AC Input', label: 'AC Input 3 Current', value: 182 },
  { valid: true, category: 'AC Input', label: 'AC Input 1 Frequency', value: 183 },
  { valid: true, category: 'AC Input', label: 'AC Input 2 Frequency', value: 184 },
  { valid: true, category: 'AC Input', label: 'AC Input 3 Frequency', value: 185 },
  { valid: true, category: 'AC Input', label: 'AC Input 1 Breaker Size', value: 186 },
  { valid: true, category: 'AC Input', label: 'AC Input 2 Breaker Size', value: 187 },
  { valid: true, category: 'AC Input', label: 'AC Input 3 Breaker Size', value: 188 },
  { valid: true, category: 'AC Input', label: 'AC Input 1 Real Power', value: 189 },
  { valid: true, category: 'AC Input', label: 'AC Input 2 Real Power', value: 190 },
  { valid: true, category: 'AC Input', label: 'AC Input 3 Real Power', value: 191 },
  { valid: true, category: 'AC Input', label: 'AC Input 1 Reactive Power', value: 192 },
  { valid: true, category: 'AC Input', label: 'AC Input 2 Reactive Power', value: 193 },
  { valid: true, category: 'AC Input', label: 'AC Input 3 Reactive Power', value: 194 },
  { valid: true, category: 'AC Input', label: 'AC Input 1 Power Factor', value: 195 },
  { valid: true, category: 'AC Input', label: 'AC Input 2 Power Factor', value: 196 },
  { valid: true, category: 'AC Input', label: 'AC Input 3 Power Factor', value: 197 },
  { valid: true, category: 'Digital Switching', label: 'Switch State', value: 198 },
  { valid: true, category: 'Digital Switching', label: 'Switch Current', value: 199 },
  { valid: true, category: 'Digital Switching', label: 'Switch Fault', value: 200 },
  { valid: true, category: 'Digital Switching', label: 'Switch Dim Level', value: 201 },
  { valid: true, category: 'Pilot', label: 'Previous Commanded Heading', value: 202 },
  { valid: true, category: 'Pilot', label: 'Commanded Wind Angle', value: 203 },
  { valid: true, category: 'Pilot', label: 'Commanded Bearing Offset', value: 204 },
  { valid: true, category: 'Pilot', label: 'Commanded Bearing', value: 205 },
  { valid: true, category: 'Pilot', label: 'Commanded Depth Contour', value: 206 },
  { valid: true, category: 'Pilot', label: 'Commanded Course Change', value: 207 },
  { valid: true, category: 'Pilot', label: 'Pilot Drift', value: 208 },
  { valid: true, category: 'Pilot', label: 'Pilot Distance To Turn', value: 209 },
  { valid: true, category: 'Pilot', label: 'Pilot Time To Turn', value: 210 },
  { valid: true, category: 'Pilot', label: 'Pilot Reference Position', value: 211 },
  { valid: true, category: 'Battery', label: 'DC Status', value: 212 },
  { valid: true, category: 'AC Input', label: 'AC Input 1 Status', value: 213 },
  { valid: true, category: 'Digital Switching', label: 'Switch Voltage', value: 214 },
  { valid: true, category: 'Battery', label: 'Battery Capacity Remaining', value: 215 },
  { valid: true, category: 'Sailing', label: 'H3000 Linear 1', value: 217 },
  { valid: true, category: 'Sailing', label: 'H3000 Linear 2', value: 218 },
  { valid: true, category: 'Sailing', label: 'H3000 Linear 3', value: 219 },
  { valid: true, category: 'Sailing', label: 'Boom Position', value: 220 },
  { valid: true, category: 'Sailing', label: 'Sailing Course', value: 221 },
  { valid: true, category: 'Sailing', label: 'Daggerboard Position', value: 222 },
  { valid: true, category: 'Sailing', label: 'H3000 Linear 4', value: 223 },
  { valid: true, category: 'Sailing', label: 'Heading on Next Tack', value: 224 },
  { valid: true, category: 'Sailing', label: 'Keel Angle', value: 225 },
  { valid: true, category: 'Sailing', label: 'Leeway', value: 226 },
  { valid: true, category: 'Sailing', label: 'Mast Angle', value: 227 },
  { valid: true, category: 'Sailing', label: 'Target True Wind Angle', value: 228 },
  { valid: true, category: 'Sailing', label: 'Keel Trim Tab', value: 229 },
  { valid: true, category: 'Sailing', label: 'Race Timer', value: 230 },
  { valid: true, category: 'Sailing', label: 'Canard Angle', value: 231 },
  { valid: true, category: 'Sailing', label: 'Next Leg Apparent Wind Angle', value: 232 },
  { valid: true, category: 'Sailing', label: 'Next Leg Apparent Wind Speed', value: 233 },
  { valid: true, category: 'Sailing', label: 'Target Boat Speed', value: 234 },
  { valid: true, category: 'Sailing', label: 'VMG to Wind', value: 235 },
  { valid: true, category: 'Sailing', label: 'Time to Layline', value: 236 },
  { valid: true, category: 'Sailing', label: 'Distance to Layline', value: 237 },
  { valid: true, category: 'Sonar', label: 'Aft Depth', value: 238 },
  { valid: true, category: 'Sailing', label: 'Fore Stay', value: 239 },
  { valid: true, category: 'Sailing', label: 'Polar Speed', value: 240 },
  { valid: true, category: 'Sailing', label: 'Polar Performance', value: 241 },
  { valid: true, category: 'Sailing', label: 'Tacking Performance', value: 242 },
  { valid: true, category: 'Sailing', label: 'Wind Angle To Mast', value: 243 },
  { valid: true, category: 'Other', label: 'CAN Bus Voltage', value: 244 },
  { valid: true, category: 'Other', label: 'Internal Temperature', value: 245 },
  { valid: true, category: 'Other', label: 'Engage Current', value: 246 },
  { valid: true, category: 'Other', label: 'URef Voltage', value: 247 },
  { valid: true, category: 'Other', label: 'Supply Voltage', value: 248 },
  { valid: true, category: 'Navigation', label: 'Destination Position', value: 249 },
  { valid: true, category: 'Engine', label: 'Engine Sync State', value: 252 },
  { valid: true, category: 'Engine', label: 'Engine Predictive General Maintenance', value: 253 },
  { valid: true, category: 'Engine', label: 'Engine Throttle', value: 254 },
  { valid: true, category: 'Engine', label: 'Engine Steering Angle', value: 255 },
  { valid: true, category: 'Engine', label: 'Engine Break In Required', value: 256 },
  { valid: true, category: 'Engine', label: 'Engine Break In Remaining', value: 258 },
  { valid: true, category: 'Engine', label: 'Engine Trim Status', value: 259 },
  { valid: true, category: 'Pilot', label: 'Autopilot Present', value: 260 },
  { valid: true, category: 'AC Output', label: 'AC Output 1 Quality', value: 261 },
  { valid: true, category: 'AC Output', label: 'AC Output 2 Quality', value: 262 },
  { valid: true, category: 'AC Output', label: 'AC Output 3 Quality', value: 263 },
  { valid: true, category: 'AC Output', label: 'AC Output 1 Voltage', value: 264 },
  { valid: true, category: 'AC Output', label: 'AC Output 2 Voltage', value: 265 },
  { valid: true, category: 'AC Output', label: 'AC Output 3 Voltage', value: 266 },
  { valid: true, category: 'AC Output', label: 'AC Output 1 Current', value: 267 },
  { valid: true, category: 'AC Output', label: 'AC Output 2 Current', value: 268 },
  { valid: true, category: 'AC Output', label: 'AC Output 3 Current', value: 269 },
  { valid: true, category: 'AC Output', label: 'AC Output 1 Frequency', value: 270 },
  { valid: true, category: 'AC Output', label: 'AC Output 2 Frequency', value: 271 },
  { valid: true, category: 'AC Output', label: 'AC Output 3 Frequency', value: 272 },
  { valid: true, category: 'AC Output', label: 'AC Output 1 Breaker Size', value: 273 },
  { valid: true, category: 'AC Output', label: 'AC Output 2 Breaker Size', value: 274 },
  { valid: true, category: 'AC Output', label: 'AC Output 3 Breaker Size', value: 275 },
  { valid: true, category: 'AC Output', label: 'AC Output 1 Real Power', value: 276 },
  { valid: true, category: 'AC Output', label: 'AC Output 2 Real Power', value: 277 },
  { valid: true, category: 'AC Output', label: 'AC Output 3 Real Power', value: 278 },
  { valid: true, category: 'AC Output', label: 'AC Output 1 Reactive Power', value: 279 },
  { valid: true, category: 'AC Output', label: 'AC Output 2 Reactive Power', value: 280 },
  { valid: true, category: 'AC Output', label: 'AC Output 3 Reactive Power', value: 281 },
  { valid: true, category: 'AC Output', label: 'AC Output 1 Power Factor', value: 282 },
  { valid: true, category: 'AC Output', label: 'AC Output 2 Power Factor', value: 283 },
  { valid: true, category: 'AC Output', label: 'AC Output 3 Power Factor', value: 284 },
  { valid: true, category: 'AC Input', label: 'AC Input 2 Status', value: 285 },
  { valid: true, category: 'AC Input', label: 'AC Input 3 Status', value: 286 },
  { valid: true, category: 'AC Output', label: 'AC Output 1 Status', value: 287 },
  { valid: true, category: 'AC Output', label: 'AC Output 2 Status', value: 288 },
  { valid: true, category: 'AC Output', label: 'AC Output 3 Status', value: 289 },
  { valid: true, category: 'Digital Switching', label: 'Switch Manual Override', value: 290 },
  { valid: true, category: 'Digital Switching', label: 'Switch Reverse Polarity', value: 291 },
  { valid: true, category: 'Digital Switching', label: 'Switch AC Source Available', value: 292 },
  { valid: true, category: 'Digital Switching', label: 'Switch AC Contactor System On State', value: 293 },
  { valid: true, category: 'Charger', label: 'Charger Battery Instance', value: 294 },
  { valid: true, category: 'Charger', label: 'Charger Operating State', value: 295 },
  { valid: true, category: 'Charger', label: 'Charger Mode', value: 296 },
  { valid: true, category: 'Charger', label: 'Charger Enabled', value: 297 },
  { valid: true, category: 'Charger', label: 'Charger Equalization Pending', value: 298 },
  { valid: true, category: 'Charger', label: 'Charger Equalization Time Remaining', value: 299 },
  { valid: true, category: 'Inverter', label: 'Inverter AC Instance', value: 300 },
  { valid: true, category: 'Inverter', label: 'Inverter DC Instance', value: 301 },
  { valid: true, category: 'Inverter', label: 'Inverter Operating State ', value: 302 },
  { valid: true, category: 'Inverter', label: 'Inverter Enabled', value: 303 },

  /* END OF SPECIFICATION - ENTRIES AFTER THIS POINT HAS BEEN DISCOVERED USING THIS TOOL */

  { valid: true, category: 'New', label: 'Sailing Time to Waypoint', value: 304 },
  { valid: true, category: 'New', label: 'Sailing Distance to Waypoint', value: 305 },
  { valid: true, category: 'New', label: 'Sailing Estimated Time of Arrival', value: 306 },
  { valid: true, category: 'New', label: 'Latitude', value: 309 },
  { valid: true, category: 'New', label: 'Longitude', value: 310 },
]);

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
  filterCategories()
})

function clearSerial() {
  serial.value = "Output cleared\n"
}

function reqFilterDataList() {
  filterInvalid.value = true
  send('{"DataListReq":{"group":1}}')
}

function reqDataList() {
  filterInvalid.value = false
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
}

function callbackDataInfo(json) {
  console.log("TODO: process dataInfo packet")
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
    }
  }
}

function clipboard() {
  console.log("Not implemented")
}

function connect() {
  // console.log("Connecting to MFD websocket")

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
    serial.value += event.data + '\n'
    socketCallback(event.data)
  }

  socket.value.onclose = function (event) {
    // console.log("Websocket close: " + event)

    serial.value += "Socket closed\n"
    socket.value = null
  }

  socket.value.onerror = function (event) {
    console.log("Websocket error: " + event)
  }
}
</script>
