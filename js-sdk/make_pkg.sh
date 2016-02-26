#/usr/bin/bash

### INIT ###
SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd )"

cd $SCRIPT_DIR

if [ -z ${1+x} ] || [ -z ${2+x} ]; then
	echo "Usage: $0 app_name app_version, e.g. $0 max-javascript 1.0.0"
	exit 1
fi

APP_NAME=$1
APP_VERSION=$2
BUILD_NUMBER=$3

### FETCH DEPENDENCIES ###
npm install

if [ ! -d node_modules ] ; then
	echo "node.js modules not installed correctly! exiting."
	exit 1
fi

### BUILD ###
grunt full

### version update ###
sed -i -- 's/1.0.0-SNAPSHOT/$APP_VERSION/g' target/magnet-sdk.js
sed -i -- 's/1.0.0-SNAPSHOT/$APP_VERSION/g' target/magnet-sdk.min.js

### PACKAGE ###
# collect temp files in target dir  (maven standard)
cd target/

# zip the SDK
zip -r $APP_NAME-$APP_VERSION.zip ./magnet-sdk.js ./magnet-sdk.min.js

# zip the docs
zip -r $APP_NAME-$APP_VERSION-docs.zip ./docs

# zip the sample apps
cd ../../samples/web
zip -r ../../js-sdk/target/$APP_NAME-$APP_VERSION-getstarted.zip getstarted
zip -r ../../js-sdk/target/$APP_NAME-$APP_VERSION-kitchen_sink.zip kitchen-sink

# replace oauth client id and secret for convenience
cd messenger/www
sed -i -- 's/76b4e8f6-1066-49e0-a537-160d436ce78c/40a0501e-7205-4917-bc79-5b201a172052/g' js/app.js
sed -i -- 's/xAq8auJL_VK5ZEWxXGNgm55WxZi67XeaFVBqxFYUCDI/0nWkq4JE1DvlEbBWfR53w5VPsiXdDHOV_U_efp6f8bE/g' js/app.js
sed -i -- 's/http:\/\/192.168.58.1:7777\/api/https:\/\/dandy.magnet.com\/mobile\/api/g' js/app.js
zip -r ../../../../js-sdk/target/$APP_NAME-$APP_VERSION-messenger.zip .


