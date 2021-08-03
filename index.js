const Person = require('./src/person')


const world = new Map()


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

const tmp = []

for (let i = 0; i < 100; i++) {
    const p = new Person(null, null, world)
    p.age = 20 + Math.round(Math.random() * 40) * 52
    tmp.push(p)
}

world.forEach((person, id) => {
    const friends = Math.random() * 20

    for (let i = 0; i < friends; i++) {
        const other = world.get([...world.keys()][Math.floor(Math.random() * world.size)])
        person.addOther(other, 2 + Math.random() * 1000, world)
    }
})


for (let i = 0; i < COUPLES; i++) {
    const a = tmp.pop()
    const b = tmp.pop()

    a.addOther(b, 4, world)
    b.addOther(a, 4, world)
    a.marriedTo = b
    b.marriedTo = a

    let c = Math.round((boxMullerRandom() + (Math.PI)) / Math.PI * MAX_CHILDREN)
    console.log('Children', c)
    for (let j = 0; j < c; j++) {
        a.gender = 'f'
        b.gender = 'm'
        new Person(a, b, world)
    }

}

const alive = new Map(world)

let ticks = 10000

//console.log(world)
console.log(world.size)

function end() {
    world.forEach(p => console.log(Math.round(p.age / 52), p.children.length))
}

tick(world, alive)

function tick(world, alive) {
    alive.forEach((person, id) => {
        if (person.age < 10) {
            person.age = 10
        }
        let factor = person.age * person.age

        factor = factor / 10000000000

        if (Math.random() < factor) {
            console.log(`Person ${person.id} died!`, factor, Math.round(person.age / 52), world.size, alive.size)
            person.alive = false
            alive.delete(person.id)
            console.log('Oldest: ', Math.round(Math.max(...Array.from(alive).map(v => v[1].age))/52))
            return
        }

        person.age++
        person.others.forEach((cl, oid) => {
            if (Math.random() < (1 / cl)) {
                const other = world.get(oid)

                if (!other.alive) {
                    person.others.delete(oid)
                    return
                }

                person.adjustCloseness(other)
                //console.log(`${id} and ${oid} met! Old value: ${cl}. New value: ${person.others.get(oid)}.`)
                //console.log('CL: ', cl, person.age, other.age, person.gender, other.gender, person.related(other))

                ageOK = (a, b) => {
                    const aa = a.age / 52
                    const bb = b.age / 52

                    if (a.gender === 'f' && aa > 45) {
                        return false
                    }

                    if (b.gender === 'f' && bb > 45) {
                        return false
                    }

                    return aa >= 15 && bb >= 15 && bb >= aa / 2 + 7
                }

                if (person.marriedTo === other) {
                    if (Math.random() < (10/(person.age + other.age)) ) {
                        let m = person
                        if (m.gender !== 'f') {
                            m = other
                        }
                        if (Math.min(...m.children.map(c => c.age)) > 42) {
                            const newPerson = new Person(person, other, world)
                            alive.set(newPerson.id, newPerson)
                        }
                    }
                } else if (cl < 30 && ageOK(person, other) && person.gender !== other.gender && !person.related(other)) {
                    person.marriedTo = other
                    other.marriedTo = person
                }
            } else {
                //console.log(`${id} and ${oid} did NOT meet! Old value: ${cl}.`)
            }
        })

        if (person.age > YEAR * 3 && person.age < YEAR * 15) {
            alive.forEach(other => {
                const diff = Math.abs(other.age - person.age) + 1
                if (Math.random() < 1 / diff) {
                    person.adjustCloseness(other)
                }
            })
        }

        // Add one random encounter each iteration
        const other = world.get([...world.keys()][Math.floor(Math.random() * world.size)])
        person.adjustCloseness(other)
    })
    

    ticks--
    console.log('Ticks left: ', ticks)
    if (ticks > 0) {
        process.nextTick(tick, world, alive)
    } else {
        end()
    }
}