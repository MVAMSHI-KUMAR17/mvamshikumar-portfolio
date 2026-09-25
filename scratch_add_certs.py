import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'(Ethics in the Age of Generative AI\.pdf"[^>]*>View Certificate</a>\s*</div>)')

match = pattern.search(content)
if not match:
    print('Could not find insertion target')
    sys.exit(1)

new_cards = '''
                      <div class="award-card fade-up glass-card delay-3" style="max-width: 350px; width: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                          <div>
                              <i class="fas fa-certificate award-icon"></i>
                              <h3>What Is Generative AI</h3>
                              <h5>LinkedIn Learning</h5>
                              <p>Understanding the fundamentals, capabilities, and real-world impact of Generative AI systems.</p>
                          </div>
                          <a href="LinkedIN/Generative AI certifications and files by microsoft and linkedin/Certifications/CertificateOfCompletion_What Is Generative AI.pdf" target="_blank" class="btn-outline" style="margin-top: 1.5rem;">View Certificate</a>
                      </div>

                      <div class="award-card fade-up glass-card delay-4" style="max-width: 350px; width: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                          <div>
                              <i class="fas fa-certificate award-icon"></i>
                              <h3>Generative AI: The Evolution of Thoughtful Online Search</h3>
                              <h5>LinkedIn Learning</h5>
                              <p>Mastering AI-driven search methodologies, prompt engineering, and the evolution of search engines.</p>
                          </div>
                          <a href="LinkedIN/generative ai evolution/certifications/CertificateOfCompletion_Generative AI The Evolution of Thoughtful Online Search.pdf" target="_blank" class="btn-outline" style="margin-top: 1.5rem;">View Certificate</a>
                      </div>

                      <div class="award-card fade-up glass-card delay-5" style="max-width: 350px; width: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                          <div>
                              <i class="fas fa-certificate award-icon"></i>
                              <h3>Learning Microsoft 365 Copilot</h3>
                              <h5>LinkedIn Learning</h5>
                              <p>Effectively utilizing Microsoft 365 Copilot to enhance productivity and streamline workflows.</p>
                          </div>
                          <a href="LinkedIN/Microsoft 365 Copilot/certificate/CertificateOfCompletion_Learning Microsoft 365 Copilot.pdf" target="_blank" class="btn-outline" style="margin-top: 1.5rem;">View Certificate</a>
                      </div>

                      <div class="award-card fade-up glass-card delay-6" style="max-width: 350px; width: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                          <div>
                              <i class="fas fa-certificate award-icon"></i>
                              <h3>Streamlining Your Work with Microsoft Copilot</h3>
                              <h5>LinkedIn Learning</h5>
                              <p>Advanced techniques for leveraging Microsoft Copilot to optimize daily tasks and efficiency.</p>
                          </div>
                          <a href="LinkedIN/Streamlining Your Work with Microsoft Copilot/certifications/CertificateOfCompletion_Streamlining Your Work with Microsoft Copilot.pdf" target="_blank" class="btn-outline" style="margin-top: 1.5rem;">View Certificate</a>
                      </div>'''

content = content[:match.end()] + '\n' + new_cards + content[match.end():]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Added new certificates successfully.')
