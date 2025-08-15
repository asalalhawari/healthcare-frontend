const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3002/api"

interface ApiResponse<T> {
  data?: T
  message?: string
  errors?: Array<{ msg: string; param: string }>
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("authToken")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  }

  // Authentication endpoints
  async login(username: string, password: string) {
    console.log("[v0] Login attempt:", { username, apiUrl: API_BASE_URL })

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    console.log("[v0] Login response status:", response.status)

    const data = await this.handleResponse<{
      token: string
      user: {
        id: string
        username: string
        fullName: string
        userType: string
        email: string
        specialization?: string
      }
    }>(response)

    // Store token in localStorage
    localStorage.setItem("authToken", data.token)

    return data
  }

  async register(userData: {
    username: string
    password: string
    email: string
    fullName: string
    userType: "patient" | "doctor" | "finance"
    specialization?: string
    dateOfBirth?: string
    phone?: string
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })

    return this.handleResponse(response)
  }

  // User endpoints
  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse(response)
  }

  async getDoctors() {
    const response = await fetch(`${API_BASE_URL}/users/doctors`, {
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse<
      Array<{
        _id: string
        fullName: string
        email: string
        specialization: string
        isAvailable: boolean
      }>
    >(response)
  }

  async updateAvailability(isAvailable: boolean) {
    const response = await fetch(`${API_BASE_URL}/users/availability`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isAvailable }),
    })

    return this.handleResponse(response)
  }

  // Visit endpoints
  async getVisits(params?: { search?: string; status?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append("search", params.search)
    if (params?.status) queryParams.append("status", params.status)
    if (params?.startDate) queryParams.append("startDate", params.startDate)
    if (params?.endDate) queryParams.append("endDate", params.endDate)

    const response = await fetch(`${API_BASE_URL}/visits?${queryParams}`, {
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse(response)
  }

  async getVisit(visitId: string) {
    const response = await fetch(`${API_BASE_URL}/visits/${visitId}`, {
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse(response)
  }

  async createVisit(visitData: {
    doctorId: string
    appointmentDate: string
    symptoms: string
  }) {
    const response = await fetch(`${API_BASE_URL}/visits`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(visitData),
    })

    return this.handleResponse(response)
  }

  async startVisit(visitId: string) {
    const response = await fetch(`${API_BASE_URL}/visits/${visitId}/start`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse(response)
  }

  async updateVisitMedical(
    visitId: string,
    medicalData: {
      diagnosis?: string
      treatments?: Array<{ name: string; description: string; cost: number }>
      notes?: string
    },
  ) {
    const response = await fetch(`${API_BASE_URL}/visits/${visitId}/medical`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(medicalData),
    })

    return this.handleResponse(response)
  }

  async completeVisit(visitId: string) {
    const response = await fetch(`${API_BASE_URL}/visits/${visitId}/complete`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse(response)
  }

  async updatePaymentStatus(visitId: string, isPaid: boolean) {
    const response = await fetch(`${API_BASE_URL}/visits/${visitId}/payment`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isPaid }),
    })

    return this.handleResponse(response)
  }

  // Statistics endpoints
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/doctors/stats`, {
      headers: this.getAuthHeaders(),
    })

    return this.handleResponse(response)
  }

  logout() {
    localStorage.removeItem("authToken")
  }
}

export const apiService = new ApiService()
