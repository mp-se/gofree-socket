# Gofree Data Explorer

GoFree Tier 2 is an API on B&G MFD (Multi Function Display) such as Simrad and Lowrance that expose data from the MFD and NMEA 2000 network. 

I wrote this software to find out what data could be extracted from my boat network. 

If you want a dashboard on your mobile device I would recommend the NMEAremote from https://www.zapfware.de/

## Deployment

You can run this from a folder or a webserver using http, https will not work since the browser security will block you from accessing the MFD then. There is also a docker image build available.

## Usage

This program just needs an IP adress to connect to your MFD, which can be found under settings networking menu on the device.

Open the index.html in the dist directory or use vue/npm to build and run the source directly.

The url should have the following format 'ws://<ip address>:2053', ws stands for WebSocket which is the protocol used by the device. 

1. Enter correct URL
2. Connect to the MFD
3. Use filter options (this will query all possible data params and remove those that is not valid)
4. Use clear to remove the init data
5. Select the value you are interrested in and press 'Req: Data' to see the value
