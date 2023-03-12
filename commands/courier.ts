//jshint esversion:8
// Coded by Sumanjay (https://github.com/cyberboysumanjay)
import { Client, Message } from "whatsapp-web.js";
import axios from "axios";
const { Axios } = axios;

async function getTrackingDetails(
  trackingService: string,
  trackingNumber: string
) {
  let statusString =
    "Unable to get information for your shipment. Please check the tracking id or try again later!";
  return new Axios()
    .get(`https://sjcourierapi.deta.dev/${trackingService}/${trackingNumber}`)
    .then(async function (response) {
      const data = response.data;
      if (trackingService == "gati") {
        const status = data.result;
        if (status == "successful") {
          const dktInfo = data.dktInfo[0];
          console.log(dktInfo);
          statusString = `Your shipment having docket number ${dktInfo.dktno} booked from ${dktInfo.bookingStation} to ${dktInfo.deliveryStation} by ${dktInfo.consigneeName} is having current status of ${dktInfo.docketStatus}.\nIt is scheduled to be delivered to ${dktInfo.ReceiversName} on or before ${dktInfo.assuredDlyDate}.`;
        }
      } else if (trackingService == "ekart") {
        try {
          const merchant = data.merchantName;
          if (merchant != null) {
            const merchantName = merchant == "FKMP" ? "Flipkart" : merchant;
            const reachedNearestHub = data.reachedNearestHub
              ? "has reached nearest hub"
              : "is yet to reach nearest hub";
            statusString = `Your shipment having tracking number ${trackingNumber} booked from ${data.sourceCity} to ${data.destinationCity} by ${merchantName} ${reachedNearestHub}.\nYour shipment is expected to be delivered to ${data.receiverName} on or before ${data.expectedDeliveryDate}.`;
          }
        } catch (error) {
          console.log(error);
        }
      }
      const out = {
        status: statusString,
      };
      return out;
    })
    .catch(function (error) {
      console.log(error);
      return { status: "error" };
    });
}
const execute = async (client: Client, msg: Message, args: string[]) => {
  const chatId = (await msg.getChat()).id._serialized;
  const data = await getTrackingDetails(args[0], args[1]);
  if (data.status === "error") {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Error*\n\n` +
        "```Something unexpected happened while fetching the courier details.```"
    );
  } else {
    await client.sendMessage(
      chatId,
      `🙇‍♂️ *Courier/Shipment Details*\n\n` + "```" + data.status + "```"
    );
  }
};

export default {
  name: "Courier",
  description:
    "Get courier details from multiple providers. Currently supports: Gati Express and Ekart",
  command: "!courier",
  commandType: "plugin",
  isDependent: false,
  help: `*courier*\n\nGet information about your couriers and shipments. \n\n*!courier [courier-name] [tracking-id]*\n\nSupported: Ekart, Gati`,
  execute,
  public: true,
};
