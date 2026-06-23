import { useQuery } from '@tanstack/react-query'

import students from '@/data/students.json'

export type Student = (typeof students)[number]
export type StudentStatus = Student['status']

const wait = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration))

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async (): Promise<Student[]> => {
      await wait(450)
      return students
    },
  })
}

export function useStudent(studentId?: string) {
  return useQuery({
    queryKey: ['students', studentId],
    queryFn: async (): Promise<Student | undefined> => {
      await wait(350)
      return students.find((student) => student.id === studentId)
    },
  })
}
