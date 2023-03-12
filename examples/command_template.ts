import { Client, Message } from "whatsapp-web.js";

//jshint esversion:8
const execute = async (client: Client, msg: Message /*,args*/) => {};

export default {
  name: "", //name of the module
  description: "", // short description of what this command does
  command: "", //command with prefix. Ex command: '!test'
  commandType: "", // admin|info|plugin
  isDependent: true, //whether this command is related/dependent to some other command
  help: "", // a string descring how to use this command Ex = help : 'To use this command type !test arguments'
  execute,
};
