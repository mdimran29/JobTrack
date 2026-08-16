import { GoogleGenAI, Type } from '@google/genai';
import { AppError } from '../../common/AppError';
import { env } from '../../config/env';
import { extractResumeText } from '../job-match/job-match.service';
import { z } from 'zod';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { BulletInput, CoverLetterInput, LatexInput, SummaryInput } from './resume-tools.schema';

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const execFileAsync = promisify(execFile);

const atsResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  verdict: z.string().min(1).max(200),
  strengths: z.array(z.string().min(1).max(300)).max(8),
  issues: z.array(z.string().min(1).max(300)).max(10),
  missingKeywords: z.array(z.string().min(1).max(80)).max(30),
  recommendations: z.array(z.string().min(1).max(300)).max(10),
});
const bulletResultSchema = z.object({ originalBullet: z.string(), rewrittenBullet: z.string().min(1).max(1000), rationale: z.string().min(1).max(500) });
const summaryResultSchema = z.object({ summary: z.string().min(1).max(1200), matchedKeywords: z.array(z.string().min(1).max(80)).max(20) });
const coverLetterResultSchema = z.object({ coverLetter: z.string().min(1).max(6000) });

const responseSchemas = {
  ats: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, verdict: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, issues: { type: Type.ARRAY, items: { type: Type.STRING } }, missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }, recommendations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['score', 'verdict', 'strengths', 'issues', 'missingKeywords', 'recommendations'] },
  bullet: { type: Type.OBJECT, properties: { originalBullet: { type: Type.STRING }, rewrittenBullet: { type: Type.STRING }, rationale: { type: Type.STRING } }, required: ['originalBullet', 'rewrittenBullet', 'rationale'] },
  summary: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['summary', 'matchedKeywords'] },
  coverLetter: { type: Type.OBJECT, properties: { coverLetter: { type: Type.STRING } }, required: ['coverLetter'] },
  latex: { type: Type.OBJECT, properties: { latex: { type: Type.STRING }, addedSkills: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['latex', 'addedSkills'] },
};

const generate = async <T>(prompt: string, schema: object, validator: z.ZodType<T>): Promise<T> => {
  let raw: string | undefined;
  try {
    const response = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0, seed: 42 },
    });
    raw = response.text;
  } catch (error) {
    console.error('Gemini resume tool request failed:', error);
    throw new AppError(502, 'AI generation failed, please try again', 'AI_GENERATION_FAILED');
  }
  if (!raw) throw new AppError(502, 'AI generation failed, please try again', 'AI_GENERATION_FAILED');
  try {
    const result = validator.safeParse(JSON.parse(raw));
    if (!result.success) {
      console.error('Gemini resume tool response validation failed:', result.error.flatten());
      throw new Error('Invalid AI response');
    }
    return result.data;
  } catch (error) {
    console.error('Gemini resume tool response parsing failed:', error);
    throw new AppError(502, 'AI generation failed, please try again', 'AI_GENERATION_FAILED');
  }
};

export const resumeToolsService = {
  async analyzeAts(resume: Express.Multer.File, jobDescription?: string) {
    const resumeText = await extractResumeText(resume);
    return generate(`Evaluate this resume for ATS compatibility. Score parsing quality, structure, clarity, keyword usage, measurable impact, and compatibility with the target job when provided. Never recommend inventing experience.\nTarget job:\n${jobDescription ?? '(not provided)'}\nResume:\n${resumeText}`, responseSchemas.ats, atsResultSchema);
  },
  rewriteBullet(input: BulletInput) {
    return generate(`Rewrite exactly one resume bullet for the target job. Preserve truthful facts and metrics, improve impact and relevant keywords, and do not add unsupported claims. Return the original bullet unchanged.\nJob: ${input.jobTitle} at ${input.companyName}\nDescription:\n${input.jobDescription}\nBullet: ${input.bullet}`, responseSchemas.bullet, bulletResultSchema);
  },
  summary(input: SummaryInput) {
    return generate(`Write a concise, job-specific resume summary (3-4 sentences) using only evidence in the resume. Emphasize relevant experience, skills, and outcomes. Do not invent facts.\nJob: ${input.jobTitle} at ${input.companyName}\nDescription:\n${input.jobDescription}\nResume:\n${input.resumeText}`, responseSchemas.summary, summaryResultSchema);
  },
  coverLetter(input: CoverLetterInput) {
    return generate(`Write a tailored cover letter of 3-5 paragraphs for this job, using only evidence in the resume. Be ${input.tone}, specific, and avoid generic claims or invented details. Do not include address/date placeholders.\nJob: ${input.jobTitle} at ${input.companyName}\nDescription:\n${input.jobDescription}\nResume:\n${input.resumeText}`, responseSchemas.coverLetter, coverLetterResultSchema);
  },
  generateLatex(input: LatexInput) {
    const escapeLatex = (value: string) => value.replace(/[&%$#_{}~^\\]/g, (character) => `\\${character}`);
    const sectionPattern = /\\(?:section|subsection)\*?\{([^{}]*)\}/g;
    const findSections = (source: string) => {
      const sections = [...source.matchAll(sectionPattern)].map((match) => ({
        title: match[1].toLowerCase(),
        start: match.index ?? 0,
        end: 0,
      }));
      sections.forEach((section, index) => {
        section.end = sections[index + 1]?.start ?? source.length;
      });
      return sections;
    };

    const categoryForSkill = (skill: string) => {
      const value = skill.toLowerCase();
      if (/react|vue|angular|frontend|front-end|html|css|javascript|typescript|next\.js|tailwind/.test(value)) return 'frontend';
      if (/solidity|smart contract|ethereum|web3|blockchain|hardhat|ethers/.test(value)) return 'blockchain';
      if (/node|python|java|spring|go|rust|backend|back-end|api|postgres|mysql|mongodb|redis|docker/.test(value)) return 'backend';
      if (/machine learning|deep learning|pandas|tensorflow|pytorch|data science|sql/.test(value)) return 'data';
      return value;
    };

    const sectionForSkill = (sections: ReturnType<typeof findSections>, skill: string) => {
      const category = categoryForSkill(skill);
      return sections.find((section) => {
        const title = section.title;
        if (category === 'frontend') return /frontend|front-end|web|ui|client|javascript/.test(title);
        if (category === 'blockchain') return /blockchain|web3|solidity|smart contract|crypto/.test(title);
        if (category === 'backend') return /backend|back-end|server|api|database|technical/.test(title);
        if (category === 'data') return /data|machine learning|analytics|technical/.test(title);
        return title.includes(category);
      }) ?? sections.find((section) => /skill|technology|tech stack|competenc/.test(section.title));
    };

    const insertIntoSection = (source: string, section: { start: number; end: number }, skill: string) => {
      const block = source.slice(section.start, section.end);
      const escapedSkill = escapeLatex(skill);
      const itemStyle = block.includes('\\resumeItem{') || block.includes('\\resumeItemListStart')
        ? `\\resumeItem{${escapedSkill}}`
        : `\\item ${escapedSkill}`;
      const listEnd = block.match(/\\end\{(?:itemize|enumerate)\}/);
      if (listEnd?.index !== undefined) {
        const absoluteIndex = section.start + listEnd.index;
        return `${source.slice(0, absoluteIndex)}  ${itemStyle}\n${source.slice(absoluteIndex)}`;
      }
      const macroEnd = block.lastIndexOf('\\resumeItemListEnd');
      if (macroEnd >= 0) {
        const absoluteIndex = section.start + macroEnd;
        return `${source.slice(0, absoluteIndex)}  ${itemStyle}\n${source.slice(absoluteIndex)}`;
      }
      const inlineEnd = source.slice(section.start, section.end).trimEnd().length + section.start;
      return `${source.slice(0, inlineEnd)}, ${escapedSkill}${source.slice(inlineEnd)}`;
    };

    let latex = input.latex;
    const inserted: string[] = [];
    input.missingSkills.forEach((skill) => {
      const target = sectionForSkill(findSections(latex), skill);
      if (!target) return;
      latex = insertIntoSection(latex, target, skill);
      inserted.push(skill);
    });

    const uninserted = input.missingSkills.filter((skill) => !inserted.includes(skill));
    if (uninserted.length > 0) {
      const existingSections = findSections(latex);
      const fallbackSection = existingSections.find((section) => /skill|technology|tech stack|competenc/.test(section.title))
        ?? existingSections.find((section) => /summary|profile|objective|experience|employment|project/.test(section.title));
      if (fallbackSection) {
        uninserted.forEach((skill) => {
          const currentSection = findSections(latex).find((section) => section.title === fallbackSection.title);
          if (currentSection) latex = insertIntoSection(latex, currentSection, skill);
        });
      }
      const endDocument = latex.lastIndexOf('\\end{document}');
      if (!fallbackSection) {
        const additions = `\n${uninserted.map(escapeLatex).join(', ')}\n`;
        latex = endDocument >= 0 ? `${latex.slice(0, endDocument)}${additions}${latex.slice(endDocument)}` : `${latex}${additions}`;
      }
    }

    return Promise.resolve({ latex, addedSkills: input.missingSkills });
  },
  async compileLatex(latex: string) {
    const directory = await mkdtemp(`${tmpdir()}/jobtrack-latex-`);
    const sourcePath = `${directory}/resume.tex`;
    const pdfPath = `${directory}/resume.pdf`;
    try {
      await writeFile(sourcePath, latex, 'utf8');
      try {
        await execFileAsync('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', '-no-shell-escape', '-output-directory', directory, sourcePath], { timeout: 30000 });
      } catch (error) {
        const compilerError = error as { code?: string; stderr?: string };
        if (compilerError.code === 'ENOENT') {
          throw new AppError(503, 'PDF export requires pdflatex to be installed on the backend.', 'LATEX_COMPILER_UNAVAILABLE');
        }
        console.error('LaTeX compilation failed:', compilerError.stderr ?? error);
        throw new AppError(422, 'The updated LaTeX could not be compiled. Check the resume template packages and syntax.', 'LATEX_COMPILE_FAILED');
      }
      return await readFile(pdfPath);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
};
