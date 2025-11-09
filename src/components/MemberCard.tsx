import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MemberCardProps {
  name: string;
  points: number;
  profilePicture?: string;
  rank: number;
  isCurrentUser?: boolean;
  onManagePoints?: () => void;
  showManage?: boolean;
}

const MemberCard = ({
  name,
  points,
  profilePicture,
  rank,
  isCurrentUser = false,
  onManagePoints,
  showManage = false,
}: MemberCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeVariant = () => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    return 'outline';
  };

  return (
    <Card className="hover-lift shadow-card overflow-hidden relative animate-slide-up">
      {/* Rank Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge variant={getRankBadgeVariant()} className="flex items-center gap-1">
          {getRankIcon()}
          <span className="font-bold">#{rank}</span>
        </Badge>
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-lg">
              <AvatarImage src={profilePicture} alt={name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            {isCurrentUser && (
              <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full p-1.5">
                <Star className="w-4 h-4 fill-current" />
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <h3 className="font-bold text-xl text-foreground">{name}</h3>
            {isCurrentUser && (
              <p className="text-sm text-muted-foreground">You</p>
            )}
          </div>

          {/* Points Display */}
          <div className="w-full space-y-2">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                {points}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Points</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${Math.min((points / 100) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Manage Button for Admins */}
          {showManage && onManagePoints && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onManagePoints}
            >
              Manage Points
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberCard;
