'use client'

import { useState, useEffect } from 'react'
import { getAllStudentsProgress, type StudentOverview } from '@/lib/api/teacherManagement'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Users, RefreshCw, Search } from 'lucide-react'

export default function StudentsManagement() {
  const [students, setStudents] = useState<StudentOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('StudentsManagement: Loading students...')
      
      const data = await getAllStudentsProgress()
      console.log('StudentsManagement: Received data:', data)
      
      setStudents(data)
    } catch (err) {
      console.error('StudentsManagement: Error loading students:', err)
      setError(err instanceof Error ? err.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  // Calculate overview statistics (simplified)
  const overviewStats = {
    totalStudents: students.length
  }

  // Filter students (basic search only)
  const filteredStudents = students.filter(student => {
    if (searchQuery) {
      return student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             student.email.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-slate-600">Loading students...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={loadStudents} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Students Management */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Manage Students</h2>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Directory
                </CardTitle>
                <CardDescription>
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} {searchQuery && 'found'}
                </CardDescription>
              </div>
              
              {/* Search and Actions */}
              <div className="flex items-center gap-3">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
                <Button 
                  onClick={loadStudents} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Student</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-12 text-center">
                        <div className="text-slate-500">
                          {students.length === 0 ? (
                            <div>
                              <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                              <p className="text-lg font-medium mb-2">No students found</p>
                              <p className="text-sm">Students will appear here once they register</p>
                            </div>
                          ) : (
                            <div>
                              <Search className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                              <p className="text-lg font-medium mb-2">No matches found</p>
                              <p className="text-sm">Try adjusting your search criteria</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.user_uuid} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {student.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{student.full_name}</div>
                              <div className="text-sm text-slate-600">Student</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-slate-900">{student.email}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 