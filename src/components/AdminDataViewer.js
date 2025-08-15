"use client"

import { useDatabase } from "../context/DatabaseContext"

export default function AdminDataViewer() {
  const { visits, doctors } = useDatabase()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">عرض البيانات</h1>

      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">الزيارات ({visits.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">المريض</th>
                <th className="border p-2">الطبيب</th>
                <th className="border p-2">التاريخ</th>
                <th className="border p-2">الحالة</th>
                <th className="border p-2">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="border p-2">{visit.id}</td>
                  <td className="border p-2">{visit.patientName}</td>
                  <td className="border p-2">{visit.doctorName}</td>
                  <td className="border p-2">{new Date(visit.date).toLocaleDateString("ar")}</td>
                  <td className="border p-2">{visit.status}</td>
                  <td className="border p-2">${visit.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">الأطباء ({doctors.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="border p-4 rounded-lg">
              <h3 className="font-semibold">{doctor.name}</h3>
              <p className="text-gray-600">{doctor.specialty}</p>
              <p className="text-sm">متاح: {doctor.available ? "نعم" : "لا"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">البيانات الخام (JSON)</h2>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify({ visits, doctors }, null, 2)}
        </pre>
      </div>
    </div>
  )
}
