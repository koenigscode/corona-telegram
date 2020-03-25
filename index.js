require("dotenv").config({ path: "env_file" })
const axios = require("axios")
const Telegraf = require("telegraf")
const bot = new Telegraf(process.env.BOT_TOKEN)
const schedule = require("node-schedule")
const { Sequelize, Model, DataTypes } = require("sequelize")
const { getBundeslandMap, formatDataToString, DateUtils } = require("./lib.js")

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



const insertIntoDB = (data) => {
    const LetzteAktualisierung = DateUtils.getDateFromString(data.LetzteAktualisierung)
    SimpleData.create({
        ...data,
        LetzteAktualisierung,
    }).catch(_ => {
        console.warn("db entry already existed")
    })
}

const getExtendedData = async data => {
    const LetzteAktualisierung = DateUtils.getDateFromString(data.LetzteAktualisierung)
    const hourEarlier = await SimpleData.findOne({
        where: {
            LetzteAktualisierung:
                DateUtils.addHours(LetzteAktualisierung, -1)
        }
    })
    const dayEarlier = await SimpleData.findOne({
        where: {
            LetzteAktualisierung: DateUtils.addDays(LetzteAktualisierung, -1)

        }
    })

    console.log("earli")
    console.log(dayEarlier)

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
