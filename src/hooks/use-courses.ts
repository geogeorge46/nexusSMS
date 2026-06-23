import { useQuery } from '@tanstack/react-query'

import courses from '@/data/courses.json'

export type Course = (typeof courses)[number]
export type CourseStatus = Course['status']

const wait = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration))

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      await wait(420)
      return courses
    },
  })
}

export function useCourse(courseId?: string) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: async (): Promise<Course | undefined> => {
      await wait(320)
      return courses.find((course) => course.id === courseId)
    },
  })
}
