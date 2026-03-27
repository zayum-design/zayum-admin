import { IsNumber, IsNotEmpty, IsPositive } from 'class-validator';

export class RechargeScoreDto {
  @IsNumber()
  @IsNotEmpty({ message: '积分数不能为空' })
  @IsPositive({ message: '积分数必须大于0' })
  score: number;
}
