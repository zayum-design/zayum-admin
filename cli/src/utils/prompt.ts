import * as readline from 'readline';

/**
 * 简单的命令行提示工具
 * 使用 process.stdin 直接读取输入，避免 readline 的兼容性问题
 */
export function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    
    const onData = (data: Buffer) => {
      const input = data.toString().trim();
      process.stdin.off('data', onData);
      process.stdin.pause();
      resolve(input);
    };
    
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', onData);
  });
}

/**
 * 使用 readline 的提示（备用方案）
 */
export function promptReadline(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}
