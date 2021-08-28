const Production = require("./production")

const NUM_TRAITS = 5
let id = 0
const boxMullerRandom = () => {
    let u = 0
    let v = 0
    while (u === 0) u = Math.random() //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

const uniformRandom = () => {
    return Math.random() - 0.5
}

class Person {

    constructor(m, f, tick) {
        id++
        this.id = id
        this.age = 0
        this.born = tick
        this.personality = []
        this.preferences = []

        this.skills = []
        this.stash = [0, 0, 0]
        this.owns = []
        this.rejected = []

        this.ill = 0
        this.alive = true

        this.targets = [10, 1, 1]

        if (f !== null && f.gender !== 'm') {
            const tmp = m
            m = f
            f = m
        }

        this.mother = m
        this.father = f

        this.children = []
        this.friends = []

        this.spouce = null

        this.gender = Math.random() > .5 ? 'f' : 'm'

        this.lastBirth = 0

        for (let i = 0; i < 3; i++) {
            this.skills[i] = Math.abs(Math.round(boxMullerRandom() * 20))
        }

        // The personality traits generated with a normal curve, not uniformly

        for (let i = 0; i < NUM_TRAITS; i++) {
            let p = 0
            let l = 0
            if (m && f) {
                p = (m.personality[i] + f.personality[i]) / 2
                l = (m.preferences[i] + f.preferences[i]) / 4
            }
            this.personality[i] = boxMullerRandom() + p
            this.preferences[i] = uniformRandom() + l
        }

        if (m && f) {
            m.children.push(this)
            f.children.push(this)
        }
    }

    checkAlive(others, recordDeath) {
        if (!this.alive) {
            return false
        }

        let factor = 0
        if (this.age < 3 * 52) {
            factor = .001
        } else if (this.age < 10 * 52) {
            factor = .00001
        } else if (this.age < 20 * 52) {
            factor = .000001
        } else if (this.age < 30 * 52) {
            factor = .000002
        } else if (this.age < 40 * 52) {
            factor = .000003
        } else if (this.age < 50 * 52) {
            factor = .00001
        } else if (this.age < 60 * 52) {
            factor = .0001
        } else if (this.age < 70 * 52) {
            factor = .001
        } else {
            factor = .01
        }

        if (this.ill > 0) {
            factor = factor * this.ill
        }

        if (Math.random() < factor) {
            this.alive = false
            recordDeath(this)

            let inheritor = null
            if (this.spouce && this.spouce.alive) {
                inheritor = this.spouce
            }
            if (!inheritor) {
                for (const c of this.children) {
                    if (c.alive) {
                        inheritor = c
                        break
                    }
                }
            }

            if (!inheritor) {
                for (const f of this.friends) {
                    if (f.alive) {
                        inheritor = f
                        break
                    }
                }
            }

            if (inheritor) {
                for (let t = 0; t < this.stash.length; t++) {
                    inheritor.stash[t] += this.stash[t]
                }

                for (const p of this.owns) {
                    inheritor.owns.push(p)
                    p.setOwner(inheritor)
                }
            } else {
                for (const p of this.owns) {
                    for (const w of p.workers) {
                        if (w.alive) {
                            w.owns.push(p)
                            p.setOwner(w)
                            break
                        }
                    }

                    if (p.owner === this) {
                        const no = others[Math.ceil(Math.random() * others.length)]
                        if (no) {
                            no.owns.push(p)
                            p.setOwner(no)
                        }
                    }

                }
            }
            this.children.length = 0
            this.friends.length = 0
            this.owns.length = 0
            this.rejected.length = 0
            this.father = null
            this.mother = null

        }

        return this.alive
    }

    train(teacherSkill, type) {

        if (type !== 1 && type !== 2 && type!== 0) {
            console.log('!!!!!!!!!!!!!!!!! FAULTY TYPE !!!!!!!!!!!!!!!')
            console.trace()
        }

        let factor = teacherSkill - this.skills[type]

        if (factor < 1) {
            factor = 1
        }

        factor = factor / 1000

        if (Math.random() < factor) {
            this.skills[type]++
        }
    }

    trade(rates, records) {
        this.targets = [this.children.length * 10 + 10, this.owns.length * 100, this.targets[2]++]

        const find = (p, t, depth = 0) => {
            for (const f of p.friends) {
                if (!f.alive) {
                    continue
                }
                if (f.stash[t] > f.targets[t]) {
                    return f
                }
            }

            if (depth < 2) {
                for (const f of p.friends) {
                    const nf = find(f, t, depth + 1)
                    if (nf) {
                        return nf
                    }
                }
            }
        }

        const sale = (p, buy, sell) => {
            if (!p) {
                return
            }

            const r = rates(sell, buy)
            const n = Math.min(p.stash[buy] - p.targets[buy], this.targets[buy] - this.stash[buy], Math.floor(this.stash[sell] / r))

            if (n < 1) {
                return
            }

            const price = Math.ceil(n * r)

            this.stash[buy] += n
            p.stash[buy] -= n
            this.stash[sell] -= price
            p.stash[sell] += price

            records[buy] += n

            //console.log(`Bought ${n} of ${buy} for ${price} of ${sell}, remaining ${this.stash[sell]}`)
        }

        for (let i = 0; i < 3 && this.stash[0] < this.targets[0]; i++) {
            if (this.stash[1] > this.targets[1]) {
                const p = find(this, 0)
                sale(p, 0, 1)
            } else if (this.stash[2] > 0) {
                const p = find(this, 0)
                sale(p, 0, 2)
            } else {
                const p = find(this, 0)
                sale(p, 0, 1)
            }
        }
        for (let i = 0; i < 3 && this.stash[1] < this.targets[1]; i++) {
            if (this.stash[0] > this.targets[0] + 20) {
                const p = find(this, 1)
                sale(p, 1, 0)
            } else if (this.stash[2] > this.targets[2]) {
                const p = find(this, 1)
                sale(p, 1, 2)
            } else {
                break
            }
        }

        for (let i = 0; i < 3 && this.stash[2] < this.targets[2]; i++) {
            if (this.stash[0] > this.targets[0] + 20) {
                const p = find(this, 2)
                sale(p, 2, 0)
            } else if (this.stash[1] > this.targets[1] + 10) {
                const p = find(this, 2)
                sale(p, 2, 1)
            } else {
                break
            }
        }

        for (let i = 0; i < this.children.length && this.stash[0] > 10; i++) {
            if (this.children[i].age < 18 * 52) {
                this.children[i].stash[0] += 5
                this.stash[0] -= 5
            }
        }

        for (const c of this.children) {
            if (c.alive && c.ill) {

                if (this.stash[0] >= 10) {
                    c.stash[0] += 10
                    this.stash[0] -= 10
                }
                if (this.stash[1] >= 1) {
                    c.stash[1] += 1
                    this.stash[1] -= 1
                }
            }
        }

        if (this.spouce && this.spouce.alive && this.spouce.ill) {
            if (this.stash[0] > 10) {
                this.stash[0] -= 10
                this.spouce.stash[0] += 10
            }
            if (this.stash[1] > 2) {
                this.stash[1] -= 2
                this.spouce.stash[0] += 2
            }
        }

        if (this.owns.length > 0) {
            if (this.stash[0] > 100) {
                const p = find(this, 1)
                sale(p, 1, 0)
            }
            if (this.stash[2] > this.targets[2]) {
                const p = find(this, 1)
                sale(p, 1, 2)
            }
        }

        if (this.stash[0] > this.targets[0] * 3 && this.stash[1] < this.targets[1] * 2) {
            const p = find(this, 1)
            sale(p, 1, 0)
        }
        if (this.stash[0] > this.targets[0] * 3) {
            const p = find(this, 2)
            sale(p, 2, 0)
        }


        if (rates(2, 1) * this.stash[2] > 1000) {
            this.targets[1] = 600
            for (let i = 0; i < 4 && this.stash[1] < 500; i++) {
                const p = find(this, 1)
                sale(p, 2, 1)
            }
        }
    }

    consume(rates) {
        if (this.age < 13 * 52) {
            this.stash[0] -= 5
        } else {
            this.stash[0] -= 10
        }

        if (this.stash[0] >= 0) {
            this.ill = 0
        }

        if (this.stash[0] < 0) {
            this.ill++
            this.stash[0] = 0
        }

        for (const p of this.owns) {
            const upkeep = Math.round(Math.random() * 10)
            if (this.stash[1] < upkeep) {
                p.max--
            } else {
                this.stash[1] -= upkeep
            }
        }

        let inc = true
        while (inc) {

            inc = false
            for (const p of this.owns) {
                if (this.stash[1] > p.max) {
                    this.stash[1] -= p.max
                    p.max++
                    inc = true
                }
            }
        }

        const depricate = () => {
            for (let i = 0; i < this.stash.length; i++) {
                const mod = Math.floor(this.stash[i] / 40)
                this.stash[i] -= mod
                if (this.stash[i] < 0) {
                    this.stash[i] = 0
                }
            }
        }

        for (const p of this.owns) {
            if (p.workers.length === 0) {
                // Dont build new if facility lacks workers...
                depricate()
                return
            }
        }

        if (this.stash[1] > 500) {
            // Build a new production with the best exchange rate

            let p = null
            if (rates(0, 1) > 5) {
                p = new Production(1)
            } else if (rates(0, 2) > 10) {
                p = new Production(2)
            } else {
                p = new Production(0)
            }
            this.stash[1] -= 500
            p.setOwner(this)
            this.owns.push(p)
            depricate()
            return p
        }
        depricate()
        return null
    }

    findWork() {
        if (this.age < 13 * 52) {
            return
        }

        if (this.owns.length > 0) {
            this.owns.sort((a, b) => b.workers.length - a.workers.length)
            this.lastWorked = this.owns[0]
            return
        }

        if (this.lastWorked) {
            this.lastWorked.addToQueue(this)
            return
        }

        if (this.rejected.length > 5) {
            this.rejected.length = 5
        }

        const options = new Set()
        const check = (f, depth = 0) => {
            for (const place of f.owns) {
                options.add(place)
            }

            if (options.size < 2 && depth < 4) {
                for (const f2 of f.friends) {
                    check(f2, depth + 1)
                }
            }
            return false
        }

        for (const f of this.friends) {
            check(f)
        }

        //console.log(Array.from(options))
        const ranked = Array.from(options).filter(p => !this.rejected.includes(p)).sort((a, b) => {


            if (b.workers.length !== a.workers.length) {
                return b.workers.length - a.workers.length
            }

            if (this.skills[b.type] !== this.skills[a.type]) {
                return this.skills[b.type] - this.skills[a.type]
            }

            return b.queue.length - a.queue.length
        })
        if (ranked.length > 0) {
            ranked[0].addToQueue(this)
            this.lastWorked = ranked[0]
        }
    }

    checkTrain() {
        if (this.age > 18 * 52) {
            return
        }

        for (let s = 0; s <this.skills.length; s++) {
            if (this.father && this.father.alive) {
                this.train(this.father.skills[s], s)
            }
            if (this.mother && this.mother.alive) {
                this.train(this.mother.skills[s], s)
            }
        }
    }

    checkMeet(world) {
        if (this.age < 3 * 52 || this.age > 75 * 52) {
            return
        }

        if (Math.random() < .01) {
            const other = world[Math.floor(Math.random() * world.length)]
            this.addFriend(other)
        }

        if (this.age < 10 * 52) {
            this.meet()
        }
        if (this.age < 18 * 52) {
            this.meet()
        }
        this.meet()
    }

    modifyPersonality() {
        if (this.age > 18 * 52 || this.age < 3 * 52) {
            return
        }


        const mod = []
        for (let i = 0; i < NUM_TRAITS; i++) {
            mod[i] = 0
        }

        for (let i = 0; i < this.friends.length && i < 5; i++) {
            for (let j = 0; j < NUM_TRAITS; j++) {
                mod[i] += this.friends[i].preferences[j]
            }
        }

        for (let i = 0; i < NUM_TRAITS; i++) {
            let desired = mod[i] / 5
            let difference = (this.personality[i] - desired) / 50
            this.personality[i] += (difference / this.age)

            difference = this.preferences[i] - desired
            this.preferences[i] += (difference / 20 / this.age)

            if (this.personality[i] < -10) {
                this.personality[i] = -10
            }
            if (this.preferences[i] < -10) {
                this.preferences[i] = -10
            }

            if (this.personality[i] > 10) {
                this.personality[i] = 10
            }
            if (this.preferences[i] > 10) {
                this.preferences[i] = 10
            }
        }
    }

    sortFriends() {
        if (this.friends.length > 2 && Math.random() < .05) {
            this.friends.splice(Math.floor(Math.random() * this.friends.length), 1);
        }

        this.friends = this.friends.map(f => f.alive ? [this.likes(f), f] : null).filter(f => f !== null)
        this.friends.sort((a, b) => b[0] - a[0])
        while (this.friends.length > 12) {
            this.friends.pop()
        }

        this.friends = this.friends.map(f => f[1])
    }

    checkMarriage() {
        if (this.spouce !== null) {
            return
        }

        if (this.age < 18 * 52) {
            return
        }


        const ageOk = (a, b) => {
            const aa = a.age / 52
            const bb = b.age / 52

            return aa >= 15 && bb >= 15 && bb >= aa / 2 + 7
        }

        for (let i = 0; i < this.friends.length; i++) {
            const f = this.friends[i]
            if (f.spouce === null &&
                f.gender !== this.gender
                && ageOk(this, f)
                && !this.related(f) &&
                f.likes(this) > 0) {

                this.spouce = f
                f.spouce = this
            } else {
                //console.log('Gender: ', this.gender !== f.gender, 'Age: ', ageOk(this, f), 'Related: ', !this.related(f),'Likes:', f.likes(this)>0)
            }
        }
    }

    checkPregnency(tick) {
        if (this.gender !== 'f' || this.age < 52 * 15 || this.age > 52 * 45) {
            return
        }

        if (this.lastBirth > tick - 52) {
            return
        }

        if (this.spouce) {
            if (Math.random() < (12 / (this.age + this.spouce.age))) {
                this.lastBirth = tick
                return new Person(this, this.spouce, tick)
            }
        } else {
            for (let i = 0; i < this.friends.length; i++) {
                const f = this.friends[i]
                if (f.gender === 'm' && this.likes(f) > 10 && f.likes(this) > 10 && !this.related(f) && Math.random() < (8 / (this.age + f.age))) {
                    this.lastBirth = tick
                    return new Person(this, f, tick)
                }
            }
        }
        return null
    }

    meet() {
        const pick = person => {
            if (!person) {
                return null
            }

            const options = new Set(person.friends)

            options.add(person.mother)
            options.add(person.father)
            if (person.mother) {
                person.mother.children.forEach(f => options.add(f))
            }

            const alive = Array.from(options).filter(f => f && f.alive)

            return alive[Math.floor(Math.random() * alive.length)];
        }

        let newFriend = pick(this)
        let i = 4
        while (i > 0) {
            if (this.addFriend(newFriend)) {
                break
            }
            i--
        }
    }

    addFriend(newFriend) {
        if (newFriend && !this.friends.includes(newFriend)) {
            this.friends.push(newFriend)
            newFriend.addFriend(this)
            return true
        }
        return false
    }

    related(other, deep = true) {
        if (this.mother === null && other.mother === null) {
            return false
        }

        return !!(other === this ||
            other.father === this.father ||
            other.mother === this.mother ||
            other.children.includes(this) ||
            this.children.includes(other) ||
            (deep && this.father && this.father.related(other, false)) ||
            (deep && this.mother && this.mother.related(other, false)))
    }

    likes(other) {
        let sum = 0
        for (let i = 0; i < NUM_TRAITS; i++) {
            sum += this.preferences[i] * other.personality[i]
        }

        sum += other.stash[0] / 50
        sum += other.stash[1] / 20
        sum += other.stash[2] / 10
        return sum
    }
}

module.exports = Person