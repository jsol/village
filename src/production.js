let id = 0

const boxMullerRandom = () => {
    let u = 0
    let v = 0
    while (u === 0) u = Math.random() //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

class Production {
    constructor(type) {
        id++
        this.id = id
        this.type = type
        this.max = 100
        this.margin = .3
        this.queue = []
        this.owner = null
        this.nepotism = []
        this.workers = []
    }

    setOwner(person) {
        this.owner = person
    }

    prefillQueue() {
        this.nepotism = this.owner.children.concat(this.owner, this.owner.father, this.owner.mother, this.owner.spouce).filter(p => !!p && p.alive && p.age > 13 * 52)
        for (const p of this.nepotism) {
            p.lastWorked = this
        }
    }

    addToQueue(person) {
        if (this.nepotism.includes(person)) {
            return
        }
        this.queue.push(person)
    }

    produce() {
        this.queue.sort((a, b) => b.skills[this.type] - a.skills[this.type])

        let best = 0
        let skill = 0
        this.workers.length = 0

        for (const p of this.nepotism) {
            if (p.lastWorked !== this) {
                continue
            }
            if (p.skills[this.type] > best) {
                best = p.skills[this.type]
            }
            this.workers.push(p)
            skill += p.skills[this.type]
        }

        for (let i = 0; i < this.queue.length; i++) {
            if (this.queue[i].lastWorked !== this) {
                continue
            }
            if (skill < this.max ) {
                this.workers.push(this.queue[i])
                skill += this.queue[i].skills[this.type]
                if (this.queue[i].skills[this.type] > best) {
                    best = this.queue[i].skills[this.type]
                }
            } else {
                this.queue[i].rejected.unshift(this)
                this.queue[i].lastWorked = null
            }
        }

        this.queue.length = 0

        if (this.workers.length === 0) {
            //console.log(this.id)
            //console.log(this.nepotism)
            //console.log(this.queue)
            return false
        }

        for (const p of this.workers) {
            p.train(best, this.type)
            for (const q of this.workers) {
                p.addFriend(q)
            }
        }

        let produced = Math.min(skill, this.max)
        produced += Math.round(produced / 10 * boxMullerRandom())
        const shares = 3 + this.nepotism.length + this.workers.length

        if (produced < shares) {
            produced = shares
        }

        const cut = Math.round(produced / shares)


        this.owner.stash[this.type] += 3 * cut + (produced % shares)

        for (const p of this.nepotism) {
            p.stash[this.type] += cut
        }

        for (const p of this.workers) {
            p.stash[this.type] += cut
            p.lastWorked = this
        }
        
        return produced
    }
}

module.exports = Production