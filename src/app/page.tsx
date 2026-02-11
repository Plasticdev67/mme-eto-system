import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FolderKanban,
  Package,
  ListChecks,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { formatDate, getProjectStatusColor, getSalesStageColor, getDepartmentColor, prettifyEnum, calculateScheduleRag, getRagColor } from "@/lib/utils"

async function getDashboardData() {
  const [
    totalProjects,
    activeProjects,
    totalProducts,
    orderProjects,
    projectsByStatus,
    departmentCounts,
    recentProjects,
    overdueProducts,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({
      where: { projectStatus: { notIn: ["COMPLETE", "OPPORTUNITY"] } },
    }),
    prisma.product.count(),
    prisma.project.count({
      where: { salesStage: "ORDER" },
    }),
    prisma.project.groupBy({
      by: ["projectStatus"],
      _count: { id: true },
    }),
    prisma.product.groupBy({
      by: ["currentDepartment"],
      _count: { id: true },
    }),
    prisma.project.findMany({
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        customer: { select: { name: true } },
        coordinator: { select: { name: true } },
        _count: { select: { products: true } },
      },
    }),
    prisma.product.findMany({
      where: {
        requiredCompletionDate: { lt: new Date() },
        currentDepartment: { notIn: ["COMPLETE", "REVIEW"] },
      },
      take: 10,
      orderBy: { requiredCompletionDate: "asc" },
      include: {
        project: { select: { id: true, projectNumber: true, name: true } },
      },
    }),
  ])

  return {
    totalProjects,
    activeProjects,
    totalProducts,
    orderProjects,
    projectsByStatus,
    departmentCounts,
    recentProjects,
    overdueProducts,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6">
      {/* Page header with quick actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of all projects and operations</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
          <Link href="/tracker">
            <Button variant="outline">
              <ListChecks className="mr-2 h-4 w-4" />
              Open Tracker
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards - now clickable */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/projects">
          <Card className="transition-shadow hover:shadow-md cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Projects</p>
                  <p className="text-3xl font-semibold text-gray-900">{data.totalProjects}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <FolderKanban className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/projects?status=DESIGN&status=MANUFACTURE&status=INSTALLATION">
          <Card className="transition-shadow hover:shadow-md cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Projects</p>
                  <p className="text-3xl font-semibold text-gray-900">{data.activeProjects}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tracker">
          <Card className="transition-shadow hover:shadow-md cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Products</p>
                  <p className="text-3xl font-semibold text-gray-900">{data.totalProducts}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
                  <Package className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/projects?salesStage=ORDER">
          <Card className="transition-shadow hover:shadow-md cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">On Order</p>
                  <p className="text-3xl font-semibold text-gray-900">{data.orderProjects}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
                  <FolderKanban className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Product pipeline by department */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Product Pipeline</CardTitle>
            <Link href="/tracker" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Open Tracker <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {data.departmentCounts.map((dc) => (
              <Link key={dc.currentDepartment} href={`/tracker?department=${dc.currentDepartment}`}>
                <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 transition-shadow hover:shadow-md cursor-pointer">
                  <Badge variant="secondary" className={getDepartmentColor(dc.currentDepartment)}>
                    {prettifyEnum(dc.currentDepartment)}
                  </Badge>
                  <span className="text-lg font-semibold text-gray-900">{dc._count.id}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Projects table - takes 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Projects</CardTitle>
              <Link href="/projects" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all <ArrowRight className="ml-1 inline h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Sales</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">Products</th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">RAG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentProjects.map((project) => {
                    const scheduleRag = calculateScheduleRag(project.targetCompletion)
                    return (
                      <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3">
                          <Link href={`/projects/${project.id}`} className="font-mono text-sm font-medium text-blue-600 hover:text-blue-700">
                            {project.projectNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-3">
                          <Link href={`/projects/${project.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{project.customer?.name || "—"}</td>
                        <td className="px-6 py-3">
                          <Badge variant="secondary" className={getProjectStatusColor(project.projectStatus)}>
                            {prettifyEnum(project.projectStatus)}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant="secondary" className={getSalesStageColor(project.salesStage)}>
                            {prettifyEnum(project.salesStage)}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-center font-mono text-gray-600">{project._count.products}</td>
                        <td className="px-6 py-3 text-center">
                          <div className={`mx-auto h-3 w-3 rounded-full ${getRagColor(scheduleRag)}`} />
                        </td>
                      </tr>
                    )
                  })}
                  {data.recentProjects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No projects yet. <Link href="/projects/new" className="text-blue-600 hover:text-blue-700">Create your first project</Link>.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right column: Attention needed + Status breakdown */}
        <div className="space-y-6">
          {/* Overdue / attention needed */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base font-semibold">Needs Attention</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {data.overdueProducts.length > 0 ? (
                <div className="space-y-3">
                  {data.overdueProducts.map((product) => (
                    <Link key={product.id} href={`/projects/${product.project.id}`}>
                      <div className="rounded-lg border border-red-100 bg-red-50 p-3 transition-shadow hover:shadow-sm cursor-pointer">
                        <p className="text-sm font-medium text-gray-900">{product.description}</p>
                        <p className="text-xs text-gray-500">
                          {product.project.projectNumber} — {product.project.name}
                        </p>
                        <p className="mt-1 text-xs font-medium text-red-600">
                          Due: {formatDate(product.requiredCompletionDate)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No overdue items. Everything on track.</p>
              )}
            </CardContent>
          </Card>

          {/* Projects by Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Projects by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.projectsByStatus.map((group) => (
                  <Link key={group.projectStatus} href={`/projects?status=${group.projectStatus}`}>
                    <div className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-gray-50 cursor-pointer">
                      <Badge variant="secondary" className={getProjectStatusColor(group.projectStatus)}>
                        {prettifyEnum(group.projectStatus)}
                      </Badge>
                      <span className="text-sm font-semibold text-gray-900">{group._count.id}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
