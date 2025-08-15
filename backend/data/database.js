const fs = require("fs")
const path = require("path")

class JSONDatabase {
  constructor() {
    this.dataDir = path.join(__dirname)
    this.usersFile = path.join(this.dataDir, "users.json")
    this.visitsFile = path.join(this.dataDir, "visits.json")

    // Initialize files if they don't exist
    this.initializeFiles()
  }

  initializeFiles() {
    if (!fs.existsSync(this.usersFile)) {
      this.writeFile(this.usersFile, [])
    }
    if (!fs.existsSync(this.visitsFile)) {
      this.writeFile(this.visitsFile, [])
    }
  }

  readFile(filePath) {
    try {
      const data = fs.readFileSync(filePath, "utf8")
      return JSON.parse(data)
    } catch (error) {
      console.error("Error reading file:", error)
      return []
    }
  }

  writeFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      return true
    } catch (error) {
      console.error("Error writing file:", error)
      return false
    }
  }

  // Users methods
  getUsers() {
    return this.readFile(this.usersFile)
  }

  addUser(user) {
    const users = this.getUsers()
    user.id = Date.now().toString()
    users.push(user)
    this.writeFile(this.usersFile, users)
    return user
  }

  findUserByUsername(username) {
    const users = this.getUsers()
    return users.find((user) => user.username === username)
  }

  findUserById(id) {
    const users = this.getUsers()
    return users.find((user) => user.id === id)
  }

  // Visits methods
  getVisits() {
    return this.readFile(this.visitsFile)
  }

  addVisit(visit) {
    const visits = this.getVisits()
    visit.id = Date.now().toString()
    visit.createdAt = new Date().toISOString()
    visits.push(visit)
    this.writeFile(this.visitsFile, visits)
    return visit
  }

  updateVisit(id, updateData) {
    const visits = this.getVisits()
    const index = visits.findIndex((visit) => visit.id === id)
    if (index !== -1) {
      visits[index] = { ...visits[index], ...updateData }
      this.writeFile(this.visitsFile, visits)
      return visits[index]
    }
    return null
  }

  findVisitById(id) {
    const visits = this.getVisits()
    return visits.find((visit) => visit.id === id)
  }
}

module.exports = new JSONDatabase()
