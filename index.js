const Person = require('./src/person')
const Production = require('./src/production')

const RUNYEARS = 300
const STARTWITH = 5000


const alive = []

const COUPLES = 20

const MAX_CHILDREN = 6

const YEAR = 52

const OFAGE = 52 * 15

const production = []

const fs = require('fs')
const fp = fs.createWriteStream('bookOfDead.json')

fp.write('{')

function recordDeath(person) {
    const m = i => person[i] !== null ? person[i].id : 0
    const data = {
        id: person.id,
        gender: person.gender,
        born: person.born,
        dead: person.born + person.age,
        spouce: m('spouce'),
        mother: m('mother'),
        father: m('father'),
        children: person.children.map(c => c.id),
        personality: person.personality,
        preferences: person.preferences,
        skills: person.skills,
        stash: person.stash.concat(),
        owns: person.owns.map(p => p.id)
    }
    fp.write(person.id + ': ' + JSON.stringify(data) + ',\n')
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

for (let i = 0; i < STARTWITH / 40; i++) {
    production.push(new Production(2))
}

for (let i = 0; i < STARTWITH / 20; i++) {
    production.push(new Production(1))
}

for (let i = 0; i < STARTWITH / 10; i++) {
    production.push(new Production(0))
}

const boxMullerRandom = () => {
    let u = 0
    let v = 0
    while (u === 0) u = Math.random() //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

let old = new Person(null, null, 0)
for (let i = 0; i < STARTWITH; i++) {
    const p = new Person(null, null, 0)
    p.addFriend(old)
    old.addFriend(p)

    p.age = (20 + Math.round(Math.random() * 10)) * 52

    for (let i = 0; i < p.skills.length; i++) {
        p.skills[i] = Math.round(Math.random() * 90) + 10 + p.skills[i]
    }
    old = p
    alive.push(p)
}

shuffleArray(alive)

for (let i = 0; i < production.length; i++) {
    alive[i].owns.push(production[i])
    production[i].setOwner(alive[i])
    alive[i].skills[production[i].type] += 60
}

//process.exit(0)

alive.forEach((person) => {
    const friends = Math.random() * 10 + 3

    for (const done = []; done.length < friends;) {
        const index = Math.floor(Math.random() * alive.length)
        if (done.includes(index)) {
            continue
        }
        done.push(index)
        const other = alive[index]
        person.addFriend(other)
    }
})

let ticks = 0

console.log(alive.length)

function r(n) {
    return Math.round(n * 10) / 10
}

function end() {
    console.log('ALIVE', alive.length)
    fp.write('}')

    let m = 0

    let a = 0
    let an = 0
    let at = 0
    let c = 0
    let fc = 0
    let fwcn = 0
    let fwc = 0
    let ct = 0
    alive.forEach(p => {
        if (p.spouce !== null) m++
        if (!p.alive) {
            a += p.age
            an++
            if (p.age > at) {
                at = p.age
            }
        }

        if (p.gender === 'f') {
            c += p.children.length
            fc++
            if (p.children.length > ct) {
                ct = p.children.length
            }

            if (p.children.length > 0) {
                fwc += p.children.length
                fwcn++
            }
        }

        //console.log(p.id, p.personality.map(r), p.preferences.map(r), p.friends.map(f => r(f[0])))
    })

    console.log('Married:', m)

    console.log('Avg age of death: ', (a / an / 52))
    console.log('Oldest death: ', (at / 52))

    console.log('Child per woman: ', c / fc, 'Child per woman with kids: ', fwc / fwcn, 'Woman with most kids: ', ct)
    //world.forEach(p => console.log(Math.round(p.age / 52),p.spouce, p.friends.map(f => [p.likes(f), f.likes(p), f.gender, p.gender, f.age, p.age])))

    

    alive.forEach(p => {
        if (p.age < 18 * 52) {
            return
        }
        console.log( {
            id: p.id,
            spouce: p.spouce ? p.spouce.id : 'no',
            children: p.children.map(c => c.id),
            gender: p.gender,
            age: Math.round(p.age / 52),
           // personality: p.personality.map(r),
            //preferences: p.preferences.map(r),
            friends: p.friends.map(f => f.id + '/' + p.likes(f)),
            owns: p.owns.map (w => w.type + '/' + w.max + '/' + w.workers.length),
            stash: p.stash,
            skill: p.skills,
            ill: p.ill,
            lastWorked: p.lastWorked ? p.lastWorked.id : 'no'
        }
        )
    })

    console.log(production.map(p => p.max))
    production.forEach(p => {
        if (!p.owner.alive) console.log(p.id, 'Owner died!')
    })
}

// ratest[a][b] => The cost to buy a with b
// rates[0][1] = .2

let rates = []
function getRate(from, to) {
    return rates[from][to]
}

function updateRates(goods_made) {
    rates = []
    rates[0] = [1, goods_made[0] / goods_made[1], goods_made[0] / goods_made[2]]
    rates[1] = [1/ rates[0][1], 1, rates[0][1] / rates[0][2]]
    rates[2] = [1/ rates[0][2], 1/rates[1][2], 1]
}

updateRates([100, 10, 1])

tick(alive)

function tick(alive) {
    let oldest = 0
    let avg = 0
    alive.forEach((person, index) => {

        if (!person.checkAlive(alive, recordDeath)) {
            alive.splice(index, 1)
            return
        }

        person.age++
        avg += person.age
        if (person.age > oldest) {
            oldest = person.age
        }

        person.checkTrain()
        person.checkMeet(alive)
        person.sortFriends()
        person.modifyPersonality()
        person.checkMarriage()
        const child = person.checkPregnency(ticks)
        if (child) {
            alive.push(child)
        }

        person.findWork()
    })

    let count = 0
    const goods_made = [0, 0, 0]
    for (const p of production) {
        const made = p.produce()
        if (made === false) {
            count ++
        } else {
            goods_made[p.type] += made
        }

        p.prefillQueue()
    }
    console.log('UNUSED PRODUCTION', count)

    const records = [1, 1, 1]
    const current_goods = [1, 1, 1]
    for (const person of alive) {
        person.trade(getRate, records)
    }
    for (const person of alive) {
        const prod = person.consume(getRate)
        if (prod) {
            console.log('CREATED NEW PRODUCTION', prod.type)
            production.push(prod)
        }
        current_goods[0] += person.stash[0]
        current_goods[1] += person.stash[1]
        current_goods[2] += person.stash[2]
    }

    updateRates(current_goods)

    ticks++
    console.log('Ticks left:', RUNYEARS * 52 - ticks, current_goods, production.length, alive.length, Math.round(oldest / 52), Math.round(avg / 52 / alive.length))
    console.log(rates)
    if (ticks < RUNYEARS * 52) {
        process.nextTick(tick, alive)
    } else {
        end()
    }
}