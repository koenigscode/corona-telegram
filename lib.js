const getBundeslandMap = dpBundesland => {
    let map = {}
    for (let item of dpBundesland) {
        map[item.label] = item.y
    }
    return map
}

const getBundeslandString = dpBundesland => {
    dpBundesland.sort((b1, b2) => b2.y - b1.y)

    let res = ""
    for (let item of dpBundesland) {
        res += `${item.label}: ${item.y}\n`
    }
    return res
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
            result += `, ${growthToString(data[key].hourEarlier, data[key].current, "1h")}`
        }
        if (data[key].dayEarlier != null) {
            result += `, ${growthToString(data[key].dayEarlier, data[key].current, "24h")}`
        }
        result += "\n"
    }

    result += "\n"

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
            result += `, ${growthToString(val.hourEarlier, val.current, "1h")}`
        }
        if (val.dayEarlier != null) {
            result += `, ${growthToString(val.dayEarlier, val.current, "24h")}`
        }
        result += "\n"
    }
    result += `\n_Stand: ${data.LetzteAktualisierung}_\n`


    return result
}

const DateUtils = {
    cloneDate: date => {
        return new Date(date.getTime())
    },
    addHours: (date, h) => {
        newDate = DateUtils.cloneDate(date)
        newDate.setTime(newDate.getTime() + h * 60 * 60 * 1000)
        return newDate
    },
    addDays: (date, d) => {
        newDate = DateUtils.cloneDate(date)
        newDate.setTime(newDate.getTime() + d * 24 * 60 * 60 * 1000)
        return newDate
    },
    getDateFromString: str => {
        const [day, month, yearAndTime, _] = str.split(".")
        const [year, time] = yearAndTime.split(" ")
        const [hour, minutes] = time.split(":")
        return new Date(year, month - 1, day, hour, minutes)
    }
}





module.exports = { DateUtils, getBundeslandMap, getBundeslandString, growthToString, formatDataToString }
