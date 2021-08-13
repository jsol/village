const Person = require('./src/person')


const world = []

const COUPLES = 20

const MAX_CHILDREN = 6

const YEAR = 52

const OFAGE = 52 * 15

const boxMullerRandom = () => {
    let u = 0
    let v = 0
    while (u === 0) u = Math.random() //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

let old = new Person(null, null)
for (let i = 0; i < 10000; i++) {
    const p = new Person(null, null)
    p.friends.push([p.likes(old), old])
    old.friends.push([old.likes(p), p])

    p.age = (20 + Math.round(Math.random() * 10)) * 52
    old = p
    world.push(p)
}

world.forEach((person) => {
    const friends = Math.random() * 20

    for (let i = 0; i < friends; i++) {
        const other = world[Math.floor(Math.random() * world.length)]
        person.friends.push([person.likes(other), other])
    }
})

const alive = world.concat() // Just get a shallow copy

let ticks = 6000

//console.log(world)
console.log(world.length)

function end() {
    console.log('WORLD', world.length)
    console.log('ALIVE', alive.length)

    let m = 0

    let a = 0
    let an = 0
    let at = 0
    let c = 0
    let fc = 0
    let fwcn = 0
    let fwc = 0
    let ct = 0
    world.forEach(p => {
        if (p.spouce !== null) m++
        if (!p.alive) {
            a+= p.age
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
                fwcn ++
            }
        }
    })

    console.log('Married:', m)

    console.log('Avg age of death: ', (a/an / 52))
    console.log('Oldest death: ', (at/52))

    console.log('Child per woman: ', c / fc, 'Child per woman with kids: ', fwc / fwcn, 'Woman with most kids: ', ct)
    //world.forEach(p => console.log(Math.round(p.age / 52),p.spouce, p.friends.map(f => [p.likes(f), f.likes(p), f.gender, p.gender, f.age, p.age])))
    //console.log(world)
}

tick(world, alive)

function tick(world, alive) {
    alive.forEach((person, index) => {

        if (!person.checkAlive()) {
            alive.splice(index, 1)
            return
        }

        person.age++

        person.checkMeet(alive)
        person.sortFriends()
        person.checkMarriage()
        const child = person.checkPregnency()
        if (child) {
            world.push(child)
            alive.push(child)
        }
    })


    ticks--
    console.log('Ticks left: ', ticks, world.length, alive.length)
    if (ticks > 0) {
        process.nextTick(tick, world, alive)
    } else {
        end()
    }
}