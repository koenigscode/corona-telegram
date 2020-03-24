require("dotenv").config()
const axios = require("axios")
const Telegraf = require("telegraf")
const bot = new Telegraf(process.env.BOT_TOKEN)
const schedule = require("node-schedule")

const rule = new schedule.RecurrenceRule()
rule.minute = [0, 15, 30, 45]
rule.second = 55

const sendUpdate = () => {
  axios
    .get(process.env.DATA_URL)
    .then(res => {
      eval(res.data)
      let answer =
        `Erkrankungen: ${Erkrankungen}\n` +
        `Hospitalisiert: ${hospitalisiert}\n` +
        `Intensivstation: ${Intensivstation}\n\n` +
        `_Stand: ${LetzteAktualisierung}_\n`
      bot.telegram
        .sendMessage(process.env.CHAT_ID, answer, {
          parse_mode: "Markdown"
        })
        .then(() => {
          console.log(`update sent: ${LetzteAktualisierung}`)
        })
    })
    .catch(err => {
      console.log(err)
    })
}

bot.on("message", ctx => {
  if (ctx.update.message.chat.username === process.env.ADMIN_USERNAME)
    sendUpdate()
})

schedule.scheduleJob(rule, sendUpdate)

bot.launch().then(() => {
  console.log("bot launched")
})
