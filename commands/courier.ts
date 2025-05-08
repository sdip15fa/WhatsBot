//jshint esversion:8
// Coded by Sumanjay (https://github.com/cyberboysumanjay)
import { Client, Message } from "whatsapp-web.js";
import { Command } from "../types/command.js";
import axios from "../helpers/axios.js";
import {
  sendLocalized,
  getGroupLanguage,
} from "../helpers/localizedMessenger.js";
import { getString } from "../helpers/i18n.js";

async function getTrackingDetails(
  trackingService: string,
  trackingNumber: string,
  lang: "en" | "yue" | "ja",
) {
  let statusString = getString("courier.error.generic", lang);
  return axios
    .get(`https://sjcourierapi.deta.dev/${trackingService}/${trackingNumber}`)
    .then(async function (response) {
      const data = response.data;
      if (trackingService == "gati") {
        const status = data.result;
        if (status == "successful") {
          const dktInfo = data.dktInfo[0];
          // console.log(dktInfo);
          statusString = getString("courier.gati.success", lang, {
            dktno: dktInfo.dktno,
            bookingStation: dktInfo.bookingStation,
            deliveryStation: dktInfo.deliveryStation,
            consigneeName: dktInfo.consigneeName,
            docketStatus: dktInfo.docketStatus,
            receiversName: dktInfo.ReceiversName,
            assuredDlyDate: dktInfo.assuredDlyDate,
          });
        } else {
          statusString = getString("courier.gati.fail", lang);
        }
      } else if (trackingService == "ekart") {
        try {
          const merchant = data.merchantName;
          if (merchant != null) {
            const merchantName = merchant == "FKMP" ? "Flipkart" : merchant;
            const reachedNearestHub = data.reachedNearestHub
              ? getString("courier.ekart.reached_hub", lang)
              : getString("courier.ekart.yet_to_reach_hub", lang);
            statusString = getString("courier.ekart.success", lang, {
              trackingNumber,
              sourceCity: data.sourceCity,
              destinationCity: data.destinationCity,
              merchantName,
              reachedNearestHub,
              receiverName: data.receiverName,
              expectedDeliveryDate: data.expectedDeliveryDate,
            });
          } else {
            statusString = getString("courier.ekart.fail", lang);
          }
        } catch (error) {
          // console.log(error);
          statusString = getString("courier.error.generic", lang);
        }
      } else {
        statusString = getString("courier.error.unsupported_service", lang, {
          trackingService,
        });
      }
      const out = {
        status: statusString,
      };
      return out;
    })
    .catch(function (error) {
      // console.log(error);
      return { status: getString("courier.error.fetch_failed", lang) };
    });
}
const execute = async (client: Client, msg: Message, args: string[]) => {
  const userLanguage = await getGroupLanguage(msg);
  const data = await getTrackingDetails(args[0], args[1], userLanguage);

  // Define the specific error messages we're looking for
  const fetchFailedError = getString(
    "courier.error.fetch_failed",
    userLanguage,
  );
  const unsupportedServiceErrorTemplate = getString(
    "courier.error.unsupported_service",
    userLanguage,
    { trackingService: args[0] },
  );
  // Check against the exact error messages if possible, or a significant unique portion
  const unsupportedServiceErrorCheck =
    unsupportedServiceErrorTemplate.substring(
      0,
      unsupportedServiceErrorTemplate.indexOf("{trackingService}") > 0
        ? unsupportedServiceErrorTemplate.indexOf("{trackingService}")
        : unsupportedServiceErrorTemplate.length,
    );

  if (data.status === fetchFailedError) {
    await sendLocalized(client, msg, "courier.error.fetch_failed");
  } else if (
    data.status.startsWith(unsupportedServiceErrorCheck) &&
    data.status.includes(args[0])
  ) {
    await sendLocalized(client, msg, "courier.error.unsupported_service", {
      trackingService: args[0],
    });
  } else if (data.status === getString("courier.error.generic", userLanguage)) {
    // Handle generic error
    await sendLocalized(client, msg, "courier.error.generic");
  } else {
    await sendLocalized(client, msg, "courier.details", {
      status: data.status,
    });
  }
};

const command: Command = {
  name: "courier.name",
  description: "courier.description",
  command: "!courier",
  commandType: "plugin",
  isDependent: false,
  help: "courier.help",
  execute,
  public: true,
};

export default command;
