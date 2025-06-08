import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Code, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
  Target
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's your code review overview.
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            <Link href="/reviews">New Review</Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2</span> from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-orange-600">2</span> urgent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.7</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+0.3</span> improvement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues Fixed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12</span> this week
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Reviews */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>
                  Your latest code review submissions and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Review Item 1 */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Code className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">React Authentication Hook</h4>
                        <p className="text-sm text-gray-600">
                          Custom hook for handling user authentication
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">TypeScript</Badge>
                          <span className="text-xs text-gray-500">2 hours ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-green-600">8.9</div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    </div>
                  </div>

                  {/* Review Item 2 */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Code className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Database Connection Pool</h4>
                        <p className="text-sm text-gray-600">
                          Optimized connection pooling for PostgreSQL
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">Node.js</Badge>
                          <span className="text-xs text-gray-500">1 day ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-yellow-600">In Progress</div>
                        <div className="text-xs text-gray-500">85% done</div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Analyzing</Badge>
                    </div>
                  </div>

                  {/* Review Item 3 */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Code className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">API Rate Limiting Middleware</h4>
                        <p className="text-sm text-gray-600">
                          Express middleware for API rate limiting
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">JavaScript</Badge>
                          <span className="text-xs text-gray-500">3 days ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">7.2</div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & AI Insights */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/reviews">
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Plus className="h-4 w-4" />
                    Submit New Code
                  </Button>
                </Link>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <TrendingUp className="h-4 w-4" />
                  View Analytics
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Users className="h-4 w-4" />
                  Team Reviews
                </Button>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>
                  Personalized recommendations for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Security Focus</p>
                    <p className="text-xs text-gray-600">
                      Consider adding input validation to your recent API endpoints
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Performance Tip</p>
                    <p className="text-xs text-gray-600">
                      Your React components show 15% improvement in rendering speed
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Code Quality</p>
                    <p className="text-xs text-gray-600">
                      Excellent use of TypeScript types in recent submissions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}