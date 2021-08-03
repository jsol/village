const NUM_TRAITS = 16
let id = 0
class Person {

    constructor(m, f, world) {
        id++
        this.id = id
        this.age = 0
        this.personality = []
        this.preferences = []
        this.alive = true

        if (f !== null && f.gender !== 'm') {
            const tmp = m
            m = f
            f = m
        }

        this.likesCache = new Map()

        this.mother = m
        this.father = f

        this.children = []

        this.gender = Math.random() > .5 ? 'f' : 'm'

        // The personality traits generated with a normal curve, not uniformly
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

        for (let i = 0; i < NUM_TRAITS; i++) {
            let p = 0
            if (m && f) {
                p = m.personality[i] + f.personality[i]
            }
            this.personality.push(boxMullerRandom() + p)
            this.preferences.push(uniformRandom())
        }

        this.others = new Map()
        world.set(this.id, this)

        if (m && f) {
            this.addOther(m, 4, world) // will also add f by association
            m.children.push(this)
            f.children.push(this)
        }
    }

    addOther(person, closeness, world) {
        if (person === this) {
            return
        }

        if (!this.others.has(person.id)) {
            person.others.forEach((v, k) => {
                if (k === this.id) {
                    return
                }

                let cl = v * closeness
                if (cl > 1000) {
                    cl = 1000
                }

                if (!this.others.has(k) || this.others.get(k) > cl) {
                    this.others.set(k, cl)
                    const other = world.get(k)
                    if (!other.others.get(this.id) || other.others.get(this.id) < cl) {
                        other.others.set(this.id, cl)
                    }
                }
            })
        }

        if (!this.others.has(person.id) || this.others.get(person.id) > closeness) {
            this.others.set(person.id, closeness)
        }
    }

    adjustCloseness(other) {
        if (other === this) {
            return
        }

        let mod = this.likes(other)
        let cl = this.others.get(other.id) || 1000
        mod = mod * cl / 20
        cl = cl - mod
        const otherCl = other.others.get(this.id) || 1000
        cl = Math.round((cl + otherCl) / 2)

        if (cl < 2) {
            cl = 2
        }

        this.others.set(other.id, cl)
        other.others.set(this.id, cl)
    }

    related(other, deep = true) {
        return !!(other === this ||
            other.father === this.father ||
            other.mother === this.mother ||
            other.children.includes(this) ||
            this.children.includes(other) ||
            (deep && this.father && this.father.related(other, false)) ||
            (deep && this.mother && this.mother.related(other, false)))
    }

    likes(other) {
        if (this.likesCache.has(other.id)) {
            return this.likesCache.get(other.id)
        }
        let sum = 0
        for (let i = 0; i < NUM_TRAITS; i++) {
            sum += this.preferences[i] * other.personality[i]
        }

        this.likesCache.set(other.id, sum)
        return sum
    }
}

module.exports = Person