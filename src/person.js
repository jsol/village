const NUM_TRAITS = 16
let id = 0
class Person {

    constructor(m, f) {
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
        this.friends = []

        this.spouce = null

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

        if (m && f) {
            m.children.push(this)
            f.children.push(this)
        }
    }

    checkAlive() {
        if (!this.alive) {
            return false
        }

        let factor = this.age
        if (factor < 10 * 52) {
            factor = 5200
        }

        factor = factor * factor * factor
        factor = factor / 100000000000000

        if (Math.random() < factor) {
            this.alive = false
        }

        return this.alive
    }


    checkMeet(world) {
        if (this.age < 3 * 52 || this.age > 75 * 52) {
            return
        }

        if (Math.random() < .01) {
            const other = world[Math.floor(Math.random() * world.length)]
            this.friends.push([this.likes(other), other])
        }

        if (this.age < 10 * 52) {
            this.meet()
        }
        if (this.age < 18 * 52) {
            this.meet()
        }
        this.meet()
    }

    sortFriends() {

        if (this.friends.length > 2 && Math.random() < .1) {
            this.friends.splice(Math.floor(Math.random()*this.friends.length), 1);
        }

        this.friends = this.friends.map(f => f[1].alive ? f : null).filter(f => f !== null)
        this.friends.sort((a, b) => b[0] - a[0])
        while (this.friends.length > 12) {
            this.friends.pop()
        }
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
            const f = this.friends[i][1]
            if (f.spouce === null &&
                f.gender !== this.gender
                && ageOk(this, f)
                && !this.related(f) &&
                f.likes(this) > 0) {

                this.spouce = f
                f.spouce = this
            }else {
                 //console.log('Gender: ', this.gender !== f.gender, 'Age: ', ageOk(this, f), 'Related: ', !this.related(f),'Likes:', f.likes(this)>0)
            }
        }

    }

    checkPregnency() {
        if (this.gender !== 'f' || this.age < 52 * 15 || this.age > 52 * 45) {
            return
        }

        if (this.spouce) {
            if (Math.random() < (10 / (this.age + this.spouce.age))) {
                if (this.children.length === 0 || Math.min(...this.children.map(c => c.age)) > 42) {
                    return new Person(this, this.spouce)
                }
            }
        } else {
            for (let i = 0; i < this.friends.length; i++) {
                const f = this.friends[i][1]
                if (f.gender === 'm' && this.likes(f) > 2 && f.likes(this) > 2 && !this.related(f) && Math.random() < (10 / (this.age + f.age))) {
                    if (this.children.length === 0 || Math.min(...this.children.map(c => c.age)) > 42) {
                        return new Person(this, f)
                    }
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
             
            let options = person.friends.concat()
            if (options.length < 2) {
                options.push([0, person.mother])
                options.push([0, person.father])
            }

            return options[Math.floor(Math.random() * options.length)][1];
        }

        let newFriend = pick(this)
        const currentFriends = this.friends.map(f => f[1])
        let i = 4
        while (currentFriends.includes(newFriend) && i > 0) {
            newFriend = pick(newFriend)
            i--
        }

        if (newFriend !== null && !currentFriends.includes(newFriend)) {
            this.friends.push([this.likes(newFriend), newFriend])
        }
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

        return sum
    }
}

module.exports = Person