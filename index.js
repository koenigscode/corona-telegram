require("dotenv").config({ path: "env_file" })
const axios = require("axios")
const Telegraf = require("telegraf")
const bot = new Telegraf(process.env.BOT_TOKEN)
const schedule = require("node-schedule")
const { Sequelize, Model, DataTypes } = require("sequelize")
const { getBundeslandMap, getBundeslandString } = require("./lib.js")

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + h * 60 * 60 * 1000)
    return this
}

Date.prototype.addDays = function (d) {
    this.setTime(this.getTime() + d * 24 * 60 * 60 * 1000)
    return this
}

const cloneDate = date => {
    return new Date(date.getTime())
}

const rule = new schedule.RecurrenceRule()
rule.minute = [0, 15, 30, 45]
rule.second = 55

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite"
})

class SimpleData extends Model { }
SimpleData.init(
    {
        LetzteAktualisierung: { type: DataTypes.DATE, primaryKey: true },
        Erkrankungen: DataTypes.INTEGER,
        Hospitalisiert: DataTypes.INTEGER,
        Intensivstation: DataTypes.INTEGER,
        T: DataTypes.INTEGER,
        OÖ: DataTypes.INTEGER,
        NÖ: DataTypes.INTEGER,
        W: DataTypes.INTEGER,
        Stmk: DataTypes.INTEGER,
        Sbg: DataTypes.INTEGER,
        Vbg: DataTypes.INTEGER,
        Ktn: DataTypes.INTEGER,
        Bgld: DataTypes.INTEGER
    },
    { sequelize, modelName: "simple_data", timestamps: false }
)

const getDateFromString = str => {
    const [day, month, yearAndTime, _] = str.split(".")
    const [year, time] = yearAndTime.split(" ")
    const [hour, minutes] = time.split(":")
    return new Date(year, month - 1, day, hour, minutes)
}

const insertIntoDB = (data) => {
    const LetzteAktualisierung = getDateFromString(data.LetzteAktualisierung)
    SimpleData.create({
        ...data,
        LetzteAktualisierung,
    }).catch(_ => {
        console.warn("db entry already existed")
    })
}

const getExtendedData = async data => {
    const LetzteAktualisierung = getDateFromString(data.LetzteAktualisierung)
    const hourEarlier = await SimpleData.findOne({
        where: {
            LetzteAktualisierung:
                cloneDate(LetzteAktualisierung).addHours(-1)
        }
    })
    const dayEarlier = await SimpleData.findOne({
        where: {
            LetzteAktualisierung: cloneDate(LetzteAktualisierung).addDays(-1)
        }
    })

    console.log(cloneDate(LetzteAktualisierung).addHours(-1))
    console.log(hourEarlier)

    let result = { LetzteAktualisierung: data.LetzteAktualisierung }

    for (key in data) {
        if (key != "LetzteAktualisierung")
            result[key] = {
                current: data[key],
                hourEarlier: hourEarlier ? hourEarlier[key] : null,
                dayEarlier: dayEarlier ? dayEarlier[key] : null
            }
    }

    return result
}

const growthToString = (oldVal, newVal, timePassed) => {
    let growth = (newVal / oldVal) - 1
    growth = (growth * 100).toFixed(2)
    if (growth >= 0) {
        growth = `+${growth}`
    }
    return `${growth}%/${timePassed}`
}

const formatDataToString = data => {
    let result = ""
    for (key of ["Erkrankungen", "Hospitalisiert", "Intensivstation"]) {
        result += `${key}: ${data[key].current}`
        if (data[key].hourEarlier != null) {
            result += ` ${growthToString(data[key].hourEarlier, data[key].current, "1h")}`
        }
        if (data[key].dayEarlier != null) {
            result += ` ${growthToString(data[key].dayEarlier, data[key].current, "1h")}`
        }
        result += "\n"
    }

    const { Erkrankungen, Hospitalisiert, Intensivstation, LetzteAktualisierung, ...dataBundesland } = data
    let arrBundesland = []
    for (key in dataBundesland) {
        arrBundesland.push([key, dataBundesland[key]])
    }

    arrBundesland.sort((b1, b2) => b2[1].current - b1[1].current)

    for (entry of arrBundesland) {
        let [key, val] = entry
        result += `${key}: ${val.current}`
        if (val.hourEarlier != null) {
            result += ` [${growthToString(val.hourEarlier, val.current, "1h")}]`
        }
        if (val.dayEarlier != null) {
            result += ` [${growthToString(val.dayEarlier, val.current, "1h")}]`
        }
        result += "\n"
    }
    result += `\n_Stand: ${data.LetzteAktualisierung}_\n`


    return result
}

const sendUpdate = async () => {
    let res = await axios.get(`${process.env.DATA_URL}/data/SimpleData.js`)
    eval(res.data.replace("hospitalisiert", "Hospitalisiert"))

    res = await axios.get(`${process.env.DATA_URL}/data/Bundesland.js`)
    eval(res.data)

    const data = {
        LetzteAktualisierung,
        Erkrankungen,
        Hospitalisiert,
        Intensivstation,
        ...getBundeslandMap(dpBundesland)
    }

    insertIntoDB(data)

    let answer = formatDataToString(await getExtendedData(data))
    bot.telegram
        .sendMessage(process.env.CHAT_ID, answer, {
            parse_mode: "Markdown"
        })
        .then(() => {
            console.log(`update sent: ${LetzteAktualisierung}`)
        })
}

bot.on("message", ctx => {
    if (ctx.update.message.chat.username === process.env.ADMIN_USERNAME)
        sendUpdate()
})

sequelize.sync().then(() => {
    schedule.scheduleJob(rule, sendUpdate)

    bot.launch().then(() => {
        console.log("bot launched")
    })
})
