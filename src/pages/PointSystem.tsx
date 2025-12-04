import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Clock, Clipboard, UserCheck, XCircle, Trophy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PointSystem = () => {
  const navigate = useNavigate();

  const dailyTaskRules = [
    {
      rule: 'Completing and uploading first',
      points: '+5',
      icon: <CheckCircle className="w-5 h-5 text-success" />,
      variant: 'success' as const,
    },
    {
      rule: 'Uploading before 10 PM',
      points: '+3',
      icon: <Clock className="w-5 h-5 text-primary" />,
      variant: 'primary' as const,
    },
    {
      rule: 'No daily task for 2 days',
      points: '-5',
      icon: <XCircle className="w-5 h-5 text-destructive" />,
      variant: 'destructive' as const,
    },
  ];

  const punctualityRules = [
    {
      rule: 'Joining session on time',
      points: '+2',
      icon: <UserCheck className="w-5 h-5 text-success" />,
      variant: 'success' as const,
    },
    {
      rule: 'Late (5+ min without informing)',
      points: '-5',
      icon: <XCircle className="w-5 h-5 text-destructive" />,
      variant: 'destructive' as const,
    },
  ];

  const quizRules = [
    {
      rule: 'Quiz Winner',
      points: '+5',
      icon: <Trophy className="w-5 h-5 text-success" />,
      variant: 'success' as const,
    },
    {
      rule: 'Quiz Second Place',
      points: '+2',
      icon: <Trophy className="w-5 h-5 text-primary" />,
      variant: 'primary' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Point System</h1>
              <p className="text-sm text-muted-foreground">
                Understand how points are earned and lost
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Daily Task Section */}
          <Card className="border-border bg-card/50 backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="w-6 h-6 text-primary" />
                📝 Daily Task
              </CardTitle>
              <CardDescription>
                Points based on task completion and timing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyTaskRules.map((item, index) => (
                    <TableRow key={index} className="hover:bg-accent/20">
                      <TableCell>{item.icon}</TableCell>
                      <TableCell className="font-medium">{item.rule}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-bold ${
                            item.variant === 'success'
                              ? 'text-success'
                              : item.variant === 'destructive'
                              ? 'text-destructive'
                              : 'text-primary'
                          }`}
                        >
                          {item.points}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Punctuality Section */}
          <Card className="border-border bg-card/50 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                ⏱ Punctuality
              </CardTitle>
              <CardDescription>
                Points based on attendance and timeliness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {punctualityRules.map((item, index) => (
                    <TableRow key={index} className="hover:bg-accent/20">
                      <TableCell>{item.icon}</TableCell>
                      <TableCell className="font-medium">{item.rule}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-bold ${
                            item.variant === 'success'
                              ? 'text-success'
                              : 'text-destructive'
                          }`}
                        >
                          {item.points}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quiz Game Section */}
          <Card className="border-border bg-card/50 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                🎯 Quiz Game
              </CardTitle>
              <CardDescription>
                Points for daily WhatsApp quiz game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizRules.map((item, index) => (
                    <TableRow key={index} className="hover:bg-accent/20">
                      <TableCell>{item.icon}</TableCell>
                      <TableCell className="font-medium">{item.rule}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-bold ${
                            item.variant === 'success'
                              ? 'text-success'
                              : 'text-primary'
                          }`}
                        >
                          {item.points}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-border bg-gradient-to-br from-primary/10 to-accent/10 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <CardTitle>💡 Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-foreground/80">
                ✓ Complete tasks early to maximize points
              </p>
              <p className="text-sm text-foreground/80">
                ✓ Join sessions on time to earn bonus points
              </p>
              <p className="text-sm text-foreground/80">
                ✓ Stay consistent to avoid point deductions
              </p>
              <p className="text-sm text-foreground/80">
                ✓ Communicate in advance if you'll be late
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PointSystem;
