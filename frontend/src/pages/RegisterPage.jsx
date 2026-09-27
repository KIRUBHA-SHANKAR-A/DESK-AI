// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import bannerImg from '../assets/helpdesk_banner.png';
// import { useTheme } from '../context/ThemeContext';

// const poppinsStyle = `
//   @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
//   body, input, button, select, textarea {
//     font-family: 'Poppins', sans-serif;
//   }
// `;

// const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// export default function RegisterPage() {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     phone: '',
//     employeeId: '',
//     designation: '',
//     role: 'EMPLOYEE',
//     departmentId: '',
//   });
//   const [departments, setDepartments] = useState([]);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const { theme, toggleTheme } = useTheme();
//   const navigate = useNavigate();

//   // Predefined IT support departments with icons
//   const IT_DEPARTMENTS = [
//     { departmentId: 1, departmentName: '🖥️ IT Support' },
//     { departmentId: 2, departmentName: '💻 Hardware Support' },
//     { departmentId: 3, departmentName: '🌐 Network Support' },
//     { departmentId: 4, departmentName: '⚙️ Software Support' },
//     { departmentId: 5, departmentName: '📧 Email Support' },
//     { departmentId: 6, departmentName: '🗄️ Database Support' },
//     { departmentId: 7, departmentName: '🖥️ Server Support' },
//     { departmentId: 8, departmentName: '🔒 Security Support' },
//   ];

//   useEffect(() => {
//     // Try to fetch from API first, fallback to predefined departments
//     fetch(`${API_BASE_URL}/departments`)
//       .then((res) => res.json())
//       .then((data) => {
//         if (Array.isArray(data) && data.length > 0) {
//           setDepartments(data);
//         } else {
//           setDepartments(IT_DEPARTMENTS);
//         }
//       })
//       .catch(() => {
//         setDepartments(IT_DEPARTMENTS);
//       });
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//       ...(name === 'role' && value !== 'SUPPORT_ENGINEER' ? { departmentId: '' } : {}),
//     }));
//   };

//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');
//     setLoading(true);

//     try {
//       const payload = {
//         ...formData,
//         email: formData.email.trim().toLowerCase(),
//         employeeId: formData.employeeId.trim(),
//         departmentId: formData.role === 'SUPPORT_ENGINEER' && formData.departmentId ? Number(formData.departmentId) : null,
//       };

//       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
//         throw new Error('Please enter a valid email address.');
//       }
//       if (payload.password.length < 8) {
//         throw new Error('Password must be at least 8 characters long.');
//       }
//       if (!/^\+?[0-9]{10,15}$/.test(payload.phone)) {
//         throw new Error('Phone number must be 10-15 digits and may start with +.');
//       }
//       if (payload.role === 'SUPPORT_ENGINEER' && !payload.departmentId) {
//         throw new Error('Please choose a department for support engineers.');
//       }

//       const res = await fetch(`${API_BASE_URL}/auth/register`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || 'Registration failed');

//       setSuccess(data.message || 'Registration successful. Please wait for admin approval.');
      
//       setTimeout(() => navigate('/login'), 2000);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   return (
//     <div className={`register-page-container ${theme}`}>
//       {/* Background blurs */}
//       <div className="aurora-container">
//         <div className="aurora-blur-1"></div>
//         <div className="aurora-blur-2"></div>
//         <div className="aurora-blur-3"></div>
//       </div>

//       {/* Floating Theme Toggler with Professional Icons */}
//       <button className="theme-toggle-fab" onClick={toggleTheme} title="Toggle Theme">
//         {theme === 'dark' ? (
//           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <circle cx="12" cy="12" r="5"/>
//             <line x1="12" y1="1" x2="12" y2="3"/>
//             <line x1="12" y1="21" x2="12" y2="23"/>
//             <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
//             <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
//             <line x1="1" y1="12" x2="3" y2="12"/>
//             <line x1="21" y1="12" x2="23" y2="12"/>
//             <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
//             <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
//           </svg>
//         ) : (
//           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
//           </svg>
//         )}
//       </button>

//       <style>{poppinsStyle}</style>

//       <div className="glass-capsule">
//         {/* Left Side - Hero Image/Branding */}
//         <div className="register-hero-section" style={{ backgroundImage: `url(${bannerImg})` }}>
//           <div className="hero-overlay">
//             <div className="hero-content">
//               {/* Logo removed - matching Login page */}
//             </div>
//           </div>
//         </div>

//         {/* Right Side - Registration Form */}
//         <div className="register-form-section">
//           <div className="form-wrapper">
//             <h2 className="form-title">Create Account</h2>
//             <p className="form-subtitle">Register for secure workspace access</p>

//             {error && <div className="alert-box error-alert">{error}</div>}
//             {success && <div className="alert-box success-alert">{success}</div>}

//             <form onSubmit={handleRegister} className="register-form">
//               <div className="form-row">
//                 <div className="field-group">
//                   <label>Full Name</label>
//                   <div className="input-with-icon">
//                     <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
//                       <circle cx="12" cy="7" r="4"/>
//                     </svg>
//                     <input
//                       name="name"
//                       type="text"
//                       className="input-premium"
//                       placeholder="John Doe"
//                       value={formData.name}
//                       onChange={handleChange}
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="field-group">
//                   <label>Employee ID</label>
//                   <div className="input-with-icon">
//                     <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
//                       <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
//                     </svg>
//                     <input
//                       name="employeeId"
//                       type="text"
//                       className="input-premium"
//                       placeholder="123456"
//                       value={formData.employeeId}
//                       onChange={handleChange}
//                       required
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="form-row">
//                 <div className="field-group">
//                   <label>Work Email</label>
//                   <div className="input-with-icon">
//                     <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
//                       <polyline points="22,6 12,13 2,6"/>
//                     </svg>
//                     <input
//                       name="email"
//                       type="email"
//                       className="input-premium"
//                       placeholder="john.doe@gmail.com"
//                       value={formData.email}
//                       onChange={handleChange}
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div className="field-group">
//                   <label>Phone Number</label>
//                   <div className="input-with-icon">
//                     <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
//                     </svg>
//                     <input
//                       name="phone"
//                       type="tel"
//                       className="input-premium"
//                       placeholder="98765 43210"
//                       value={formData.phone}
//                       onChange={handleChange}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="form-row">
//                 <div className="field-group">
//                   <label>Password</label>
//                   <div className="input-with-icon">
//                     <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
//                       <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
//                     </svg>
//                     <input
//                       name="password"
//                       type={showPassword ? "text" : "password"}
//                       className="input-premium"
//                       placeholder="••••••••"
//                       value={formData.password}
//                       onChange={handleChange}
//                       required
//                     />
//                     <button
//                       type="button"
//                       className="password-toggle-btn"
//                       onClick={togglePasswordVisibility}
//                       tabIndex="-1"
//                     >
//                       {showPassword ? (
//                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                           <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
//                           <line x1="1" y1="1" x2="23" y2="23"/>
//                         </svg>
//                       ) : (
//                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
//                           <circle cx="12" cy="12" r="3"/>
//                         </svg>
//                       )}
//                     </button>
//                   </div>
//                 </div>

//                 <div className="field-group">
//                   <label>Designation</label>
//                   <div className="input-with-icon">
//                     <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
//                       <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
//                     </svg>
//                     <input
//                       name="designation"
//                       type="text"
//                       className="input-premium"
//                       placeholder="System Analyst"
//                       value={formData.designation}
//                       onChange={handleChange}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="form-row">
//                 <div className="field-group">
//                   <label>Role</label>
//                   <div className="input-with-icon">
//                     <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
//                     </svg>
//                     <select
//                       name="role"
//                       className="input-premium select-premium"
//                       value={formData.role}
//                       onChange={handleChange}
//                     >
//                       <option value="EMPLOYEE">Employee</option>
//                       <option value="SUPPORT_ENGINEER">Support Engineer</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="field-group">
//                   <label>Department</label>
//                   <div className="input-with-icon">
//                     <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
//                       <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
//                     </svg>
//                     <select
//                       name="departmentId"
//                       className={`input-premium select-premium ${formData.role !== 'SUPPORT_ENGINEER' ? 'select-disabled' : ''}`}
//                       value={formData.departmentId}
//                       onChange={handleChange}
//                       disabled={formData.role !== 'SUPPORT_ENGINEER'}
//                       required={formData.role === 'SUPPORT_ENGINEER'}
//                     >
//                       <option value="">{formData.role === 'SUPPORT_ENGINEER' ? ' Select your department...' : ' Only for support engineers'}</option>
//                       {departments.map((dept) => (
//                         <option key={dept.departmentId} value={dept.departmentId}>
//                           {dept.departmentName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <button 
//                 type="submit" 
//                 className="btn-premium full-width mt-2" 
//                 disabled={loading}
//               >
//                 {loading ? 'Creating Account...' : 'Create Account'}
//               </button>
//             </form>

//             <div className="form-footer">
//               <p>Already have an account? <Link to="/login">Sign In</Link></p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         /* Theme Variables - Same as Login page */
//         .register-page-container {
//           --bg-primary: #080c1a;
//           --bg-panel: rgba(15, 23, 42, 0.85);
//           --bg-card: rgba(255, 255, 255, 0.05);
//           --bg-input: rgba(255, 255, 255, 0.08);
//           --text-primary: #eef2ff;
//           --text-secondary: #b9c8f0;
//           --text-muted: #8a9bc0;
//           --border: rgba(255, 255, 255, 0.06);
//           --border-glow: rgba(56, 189, 248, 0.3);
//           --accent-cyan: #7dd3fc;
//           --accent-blue: #38bdf8;
//           --shadow-neon: 0 0 30px rgba(99, 102, 241, 0.2);
//           --radius-sm: 12px;
//           --theme-transition: 0.4s ease;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           min-height: 100vh;
//           padding: 24px;
//           background: var(--bg-primary);
//           transition: background var(--theme-transition);
//         }

//         /* Light Theme */
//         .register-page-container.light {
//           --bg-primary: #f0f4ff;
//           --bg-panel: rgba(255, 255, 255, 0.85);
//           --bg-card: rgba(0, 0, 0, 0.03);
//           --bg-input: rgba(255, 255, 255, 0.9);
//           --text-primary: #0a1628;
//           --text-secondary: #2a3a6a;
//           --text-muted: #4a5a7a;
//           --border: rgba(0, 0, 0, 0.08);
//           --border-glow: rgba(37, 99, 235, 0.3);
//           --accent-cyan: #2563eb;
//           --accent-blue: #3b82f6;
//           --shadow-neon: 0 0 30px rgba(37, 99, 235, 0.15);
//         }

//         .theme-toggle-fab {
//           position: fixed;
//           top: 24px;
//           right: 24px;
//           width: 48px;
//           height: 48px;
//           border-radius: 50%;
//           background: var(--bg-card);
//           border: 1px solid var(--border);
//           color: var(--text-primary);
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
//           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//           z-index: 100;
//           padding: 0;
//         }
//         .theme-toggle-fab:hover {
//           transform: scale(1.1) rotate(15deg);
//           border-color: var(--border-glow);
//           box-shadow: var(--shadow-neon);
//         }

//         .theme-toggle-fab svg {
//           stroke: currentColor;
//           transition: transform 0.3s ease;
//         }

//         .theme-toggle-fab:hover svg {
//           transform: rotate(30deg);
//         }

//         /* Aurora Background */
//         .aurora-container {
//           position: fixed;
//           inset: 0;
//           z-index: 0;
//           pointer-events: none;
//         }

//         .aurora-blur-1,
//         .aurora-blur-2,
//         .aurora-blur-3 {
//           position: absolute;
//           border-radius: 50%;
//           filter: blur(120px);
//           opacity: 0.3;
//           transition: opacity var(--theme-transition);
//         }

//         .aurora-blur-1 {
//           width: 600px;
//           height: 600px;
//           background: #4f46e5;
//           top: -10%;
//           left: -5%;
//         }
//         .aurora-blur-2 {
//           width: 500px;
//           height: 500px;
//           background: #0ea5e9;
//           bottom: -10%;
//           right: -5%;
//         }
//         .aurora-blur-3 {
//           width: 400px;
//           height: 400px;
//           background: #8b5cf6;
//           top: 50%;
//           left: 40%;
//         }

//         .register-page-container.light .aurora-blur-1,
//         .register-page-container.light .aurora-blur-2,
//         .register-page-container.light .aurora-blur-3 {
//           opacity: 0.1;
//         }

//         .glass-capsule {
//           background: var(--bg-panel);
//           border: 1px solid var(--border);
//           border-radius: 28px;
//           width: 100%;
//           max-width: 1100px;
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           overflow: hidden;
//           box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.1);
//           transition: all var(--theme-transition);
//           min-height: 600px;
//           position: relative;
//           z-index: 1;
//         }

//         /* Left Side - Hero Section */
//         .register-hero-section {
//           background-size: cover;
//           background-position: center;
//           position: relative;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }

//         .hero-overlay {
//           background: transparent;
//           padding: 0;
//           height: 100%;
//           width: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }

//         .register-page-container.light .hero-overlay {
//           background: transparent;
//         }

//         .hero-content {
//           text-align: center;
//           max-width: 400px;
//         }

//         /* Right Side - Registration Form */
//         .register-form-section {
//           padding: 40px 36px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           border-left: 1px solid var(--border);
//         }

//         .form-wrapper {
//           width: 100%;
//           max-width: 480px;
//         }

//         .form-title {
//           font-size: 2rem;
//           font-weight: 700;
//           margin-bottom: 6px;
//           color: var(--text-primary);
//         }

//         .form-subtitle {
//           color: var(--text-secondary);
//           font-size: 0.95rem;
//           margin-bottom: 24px;
//         }

//         .register-form {
//           display: flex;
//           flex-direction: column;
//           gap: 16px;
//         }

//         .form-row {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 16px;
//         }

//         .field-group {
//           display: flex;
//           flex-direction: column;
//           gap: 6px;
//         }

//         .field-group label {
//           font-size: 0.85rem;
//           font-weight: 600;
//           color: var(--text-secondary);
//           letter-spacing: 0.02em;
//         }

//         .input-with-icon {
//           position: relative;
//           display: flex;
//           align-items: center;
//         }

//         .field-icon {
//           position: absolute;
//           left: 12px;
//           font-size: 1rem;
//           pointer-events: none;
//           color: var(--text-muted);
//           z-index: 2;
//         }

//         .input-premium {
//           width: 100%;
//           padding: 12px 16px 12px 38px;
//           background: var(--bg-input);
//           border: 2px solid var(--border);
//           border-radius: var(--radius-sm);
//           color: var(--text-primary);
//           font-size: 0.95rem;
//           transition: all 0.3s ease;
//           outline: none;
//         }

//         /* Select Premium Styling */
//         .select-premium {
//           appearance: none;
//           background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
//           background-repeat: no-repeat;
//           background-position: right 14px center;
//           padding-right: 40px;
//           cursor: pointer;
//           background-color: var(--bg-input);
//         }

//         .register-page-container:not(.light) .select-premium {
//           background-color: rgba(255, 255, 255, 0.08);
//           color: #eef2ff;
//           border-color: rgba(255, 255, 255, 0.1);
//         }

//         .register-page-container:not(.light) .select-premium option {
//           background: #1a1a2e;
//           color: #eef2ff;
//           padding: 8px;
//         }

//         .register-page-container.light .select-premium {
//           background-color: #ffffff;
//           color: #0a1628;
//           border-color: rgba(0, 0, 0, 0.1);
//           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
//         }

//         .register-page-container.light .select-premium option {
//           background: #ffffff;
//           color: #0a1628;
//           padding: 8px;
//         }

//         .select-premium:focus {
//           border-color: var(--accent-blue);
//           box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
//         }

//         .register-page-container.light .select-premium:focus {
//           border-color: var(--accent-cyan);
//           box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
//         }

//         .select-disabled {
//           opacity: 0.5;
//           cursor: not-allowed;
//           border-style: dashed;
//         }

//         .select-disabled:hover {
//           border-color: var(--border) !important;
//         }

//         .input-premium:hover:not(:disabled) {
//           border-color: var(--border-glow);
//         }

//         /* Password toggle button */
//         .password-toggle-btn {
//           position: absolute;
//           right: 12px;
//           background: none;
//           border: none;
//           cursor: pointer;
//           padding: 4px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           color: var(--text-muted);
//           transition: color 0.2s ease;
//           z-index: 2;
//         }

//         .password-toggle-btn:hover {
//           color: var(--text-primary);
//         }

//         .password-toggle-btn svg {
//           stroke: currentColor;
//         }

//         /* Dark mode input */
//         .register-page-container:not(.light) .input-premium {
//           background: rgba(255, 255, 255, 0.08);
//           color: #eef2ff;
//           border-color: rgba(255, 255, 255, 0.1);
//         }

//         .register-page-container:not(.light) .input-premium:focus {
//           border-color: rgba(56, 189, 248, 0.4);
//           box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
//         }

//         .register-page-container:not(.light) .input-premium::placeholder {
//           color: rgba(255, 255, 255, 0.4);
//         }

//         .register-page-container:not(.light) .password-toggle-btn {
//           color: rgba(255, 255, 255, 0.4);
//         }

//         .register-page-container:not(.light) .password-toggle-btn:hover {
//           color: rgba(255, 255, 255, 0.8);
//         }

//         /* Light mode input */
//         .register-page-container.light .input-premium {
//           background: #ffffff;
//           color: #0a1628;
//           border-color: rgba(0, 0, 0, 0.1);
//           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
//         }

//         .register-page-container.light .input-premium:focus {
//           border-color: rgba(37, 99, 235, 0.4);
//           box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
//         }

//         .register-page-container.light .input-premium::placeholder {
//           color: rgba(0, 0, 0, 0.3);
//         }

//         .register-page-container.light .password-toggle-btn {
//           color: rgba(0, 0, 0, 0.3);
//         }

//         .register-page-container.light .password-toggle-btn:hover {
//           color: rgba(0, 0, 0, 0.6);
//         }

//         /* Dark mode field icon */
//         .register-page-container:not(.light) .field-icon {
//           color: rgba(255, 255, 255, 0.4);
//         }

//         /* Light mode field icon */
//         .register-page-container.light .field-icon {
//           color: rgba(0, 0, 0, 0.3);
//         }

//         /* Dark mode labels */
//         .register-page-container:not(.light) .field-group label {
//           color: rgba(255, 255, 255, 0.7);
//         }

//         /* Light mode labels */
//         .register-page-container.light .field-group label {
//           color: rgba(0, 0, 0, 0.6);
//         }

//         .btn-premium {
//           background: linear-gradient(135deg, #2563eb, #7c3aed);
//           color: white;
//           font-weight: 600;
//           padding: 14px 28px;
//           border: none;
//           border-radius: 99px;
//           font-size: 1rem;
//           cursor: pointer;
//           transition: all 0.3s ease;
//           box-shadow: 0 4px 25px rgba(37, 99, 235, 0.3);
//           width: 100%;
//         }

//         .btn-premium:hover:not(:disabled) {
//           transform: scale(1.02);
//           box-shadow: 0 8px 35px rgba(37, 99, 235, 0.4);
//         }

//         .full-width {
//           width: 100%;
//           justify-content: center;
//           grid-column: span 2;
//         }

//         .mt-2 { 
//           margin-top: 4px; 
//         }

//         .form-footer {
//           margin-top: 24px;
//           text-align: center;
//           font-size: 0.9rem;
//           color: var(--text-secondary);
//           padding-top: 20px;
//           border-top: 1px solid var(--border);
//         }

//         .form-footer a {
//           color: var(--accent-cyan);
//           font-weight: 600;
//           text-decoration: none;
//           transition: color 0.2s ease;
//         }
//         .form-footer a:hover {
//           color: var(--accent-blue);
//           text-decoration: underline;
//         }

//         .alert-box {
//           padding: 12px 16px;
//           border-radius: var(--radius-sm);
//           font-size: 0.9rem;
//           margin-bottom: 20px;
//           border: 2px solid;
//         }

//         .error-alert {
//           background: rgba(239, 68, 68, 0.1);
//           color: #f87171;
//           border-color: rgba(239, 68, 68, 0.3);
//         }

//         .register-page-container.light .error-alert {
//           background: rgba(239, 68, 68, 0.05);
//           color: #dc2626;
//           border-color: rgba(239, 68, 68, 0.2);
//         }

//         .success-alert {
//           background: rgba(34, 197, 94, 0.1);
//           color: #4ade80;
//           border-color: rgba(34, 197, 94, 0.3);
//         }

//         .register-page-container.light .success-alert {
//           background: rgba(34, 197, 94, 0.05);
//           color: #16a34a;
//           border-color: rgba(34, 197, 94, 0.2);
//         }

//         /* Responsive */
//         @media (max-width: 992px) {
//           .glass-capsule {
//             grid-template-columns: 1fr;
//             max-width: 600px;
//             min-height: auto;
//           }

//           .register-hero-section {
//             border-bottom: 1px solid var(--border);
//             min-height: 200px;
//             border-right: none;
//           }

//           .register-form-section {
//             padding: 32px 24px;
//             border-left: none;
//           }

//           .full-width {
//             grid-column: span 1;
//           }
//         }

//         @media (max-width: 640px) {
//           .register-page-container {
//             padding: 16px;
//           }

//           .glass-capsule {
//             border-radius: 20px;
//           }

//           .register-hero-section {
//             min-height: 150px;
//           }

//           .register-form-section {
//             padding: 24px 16px;
//           }

//           .form-title {
//             font-size: 1.6rem;
//           }

//           .form-row {
//             grid-template-columns: 1fr;
//           }

//           .full-width {
//             grid-column: span 1;
//           }

//           .theme-toggle-fab {
//             width: 40px;
//             height: 40px;
//             top: 16px;
//             right: 16px;
//           }
//         }

//         /* Disabled button state */
//         .btn-premium:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//           transform: none !important;
//         }

//         /* Input autofill styles */
//         .input-premium:-webkit-autofill,
//         .input-premium:-webkit-autofill:hover,
//         .input-premium:-webkit-autofill:focus {
//           -webkit-box-shadow: 0 0 0 1000px var(--bg-input) inset !important;
//           -webkit-text-fill-color: var(--text-primary) !important;
//           transition: background-color 5000s ease-in-out 0s;
//         }

//         .register-page-container.light .input-premium:-webkit-autofill,
//         .register-page-container.light .input-premium:-webkit-autofill:hover,
//         .register-page-container.light .input-premium:-webkit-autofill:focus {
//           -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
//           -webkit-text-fill-color: #0a1628 !important;
//         }

//         /* Select autofill fix */
//         select.input-premium:-webkit-autofill {
//           -webkit-box-shadow: 0 0 0 1000px var(--bg-input) inset !important;
//           -webkit-text-fill-color: var(--text-primary) !important;
//         }

//         /* Option styling */
//         select.input-premium option {
//           padding: 8px;
//           font-size: 0.95rem;
//         }

//         /* Hover effect for select options */
//         select.input-premium option:hover {
//           background: var(--accent-blue);
//           color: white;
//         }
//       `}</style>
//     </div>
//   );
// }




import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bannerImg from '../assets/helpdesk_banner.png';
import { useTheme } from '../context/ThemeContext';

const poppinsStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  body, input, button, select, textarea {
    font-family: 'Poppins', sans-serif;
  }
`;

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    employeeId: '',
    designation: '',
    role: 'EMPLOYEE',
    departmentId: '',
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Complete department list with all departments
  const ALL_DEPARTMENTS = [
    { departmentId: 1, departmentName: 'IT Support' },
    { departmentId: 2, departmentName: 'Hardware Support' },
    { departmentId: 3, departmentName: 'Software Support' },
    { departmentId: 4, departmentName: 'Network Support' },
    { departmentId: 5, departmentName: 'Database Support' },
    { departmentId: 6, departmentName: 'Server Support' },
    { departmentId: 7, departmentName: 'Email Support' },
    { departmentId: 8, departmentName: 'Security Support' },
    { departmentId: 9, departmentName: 'Human Resources' },
    { departmentId: 10, departmentName: 'Finance' },
    { departmentId: 11, departmentName: 'Sales' },
    { departmentId: 12, departmentName: 'Marketing' },
    { departmentId: 13, departmentName: 'Administration' },
    { departmentId: 14, departmentName: 'Information Technology' },
    { departmentId: 15, departmentName: 'Operations' },
    { departmentId: 16, departmentName: 'Customer Support' },
  ];

  // Department lists based on role
  const DEPARTMENT_LISTS = {
    EMPLOYEE: [
      { departmentId: 9, departmentName: 'Human Resources' },
      { departmentId: 10, departmentName: 'Finance' },
      { departmentId: 11, departmentName: 'Sales' },
      { departmentId: 12, departmentName: 'Marketing' },
      { departmentId: 13, departmentName: 'Administration' },
      { departmentId: 14, departmentName: 'Information Technology' },
      { departmentId: 15, departmentName: 'Operations' },
      { departmentId: 16, departmentName: 'Customer Support' },
    ],
    SUPPORT_ENGINEER: [
      { departmentId: 1, departmentName: 'IT Support' },
      { departmentId: 2, departmentName: 'Hardware Support' },
      { departmentId: 3, departmentName: 'Software Support' },
      { departmentId: 4, departmentName: 'Network Support' },
      { departmentId: 5, departmentName: 'Database Support' },
      { departmentId: 6, departmentName: 'Server Support' },
      { departmentId: 7, departmentName: 'Email Support' },
      { departmentId: 8, departmentName: 'Security Support' },
    ],
  };
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 400);
    return () => clearTimeout(timer);
  }, [location.pathname]);
  // Get departments based on current role
  const getDepartmentsForRole = (role) => {
    return DEPARTMENT_LISTS[role] || DEPARTMENT_LISTS.EMPLOYEE;
  };

  useEffect(() => {
    // Try to fetch from API first, fallback to predefined departments based on role
    fetch(`${API_BASE_URL}/departments`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
        } else {
          setDepartments(getDepartmentsForRole(formData.role));
        }
      })
      .catch(() => {
        setDepartments(getDepartmentsForRole(formData.role));
      });
  }, []);

  // Update departments when role changes
  useEffect(() => {
    setDepartments(getDepartmentsForRole(formData.role));
    // Reset departmentId when role changes
    setFormData(prev => ({
      ...prev,
      departmentId: '',
    }));
  }, [formData.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'role' ? { departmentId: '' } : {}),
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        employeeId: formData.employeeId.trim(),
        departmentId: formData.departmentId ? Number(formData.departmentId) : null,
      };

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        throw new Error('Please enter a valid email address.');
      }
      if (payload.password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }
      if (!/^\+?[0-9]{10,15}$/.test(payload.phone)) {
        throw new Error('Phone number must be 10-15 digits and may start with +.');
      }
      if (!payload.departmentId) {
        throw new Error('Please select a department.');
      }

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setSuccess(data.message || 'Registration successful. Please wait for admin approval.');
      
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`register-page-container ${theme}`}>
      {/* Background blurs */}
      <div className="aurora-container">
        <div className="aurora-blur-1"></div>
        <div className="aurora-blur-2"></div>
        <div className="aurora-blur-3"></div>
      </div>

      {/* Floating Theme Toggler with Professional Icons */}
      <button className="theme-toggle-fab" onClick={toggleTheme} title="Toggle Theme">
        {theme === 'dark' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
          </svg>
        )}
      </button>

      <style>{poppinsStyle}</style>

      <div  className={`glass-capsule ${isTransitioning ? 'slide-in' : ''}`}>
        {/* Left Side - Hero Image/Branding */}
        <div className="register-hero-section" style={{ backgroundImage: `url(${bannerImg})` }}>
          <div className="hero-overlay">
            <div className="hero-content">
              {/* Logo removed - matching Login page */}
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="register-form-section">
          <div className="form-wrapper">
            <h2 className="form-title">Create Account</h2>
            <p className="form-subtitle">Register for secure workspace access</p>

            {error && <div className="alert-box error-alert">{error}</div>}
            {success && <div className="alert-box success-alert">{success}</div>}

            <form onSubmit={handleRegister} className="register-form">
              <div className="form-row">
                <div className="field-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input
                      name="name"
                      type="text"
                      className="input-premium"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label>Employee ID</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    <input
                      name="employeeId"
                      type="text"
                      className="input-premium"
                      placeholder="123456"
                      value={formData.employeeId}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label>Work Email</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      name="email"
                      type="email"
                      className="input-premium"
                      placeholder="john.doe@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label>Phone Number</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <input
                      name="phone"
                      type="tel"
                      className="input-premium"
                      placeholder="98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="input-premium"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={togglePasswordVisibility}
                      tabIndex="-1"
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label>Designation</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    <input
                      name="designation"
                      type="text"
                      className="input-premium"
                      placeholder="System Analyst"
                      value={formData.designation}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label>Role</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <select
                      name="role"
                      className="input-premium select-premium"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="SUPPORT_ENGINEER">Support Engineer</option>
                    </select>
                  </div>
                </div>

                <div className="field-group">
                  <label>Department</label>
                  <div className="input-with-icon">
                    <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    <select
                      name="departmentId"
                      className="input-premium select-premium"
                      value={formData.departmentId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select your department...</option>
                      {departments.map((dept) => (
                        <option key={dept.departmentId} value={dept.departmentId}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-premium full-width mt-2" 
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="form-footer">
              <p>Already have an account? <Link to="/login">Sign In</Link></p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Theme Variables - Same as Login page */
        .register-page-container {
          --bg-primary: #080c1a;
          --bg-panel: rgba(15, 23, 42, 0.85);
          --bg-card: rgba(255, 255, 255, 0.05);
          --bg-input: rgba(255, 255, 255, 0.08);
          --text-primary: #eef2ff;
          --text-secondary: #b9c8f0;
          --text-muted: #8a9bc0;
          --border: rgba(255, 255, 255, 0.06);
          --border-glow: rgba(56, 189, 248, 0.3);
          --accent-cyan: #7dd3fc;
          --accent-blue: #38bdf8;
          --shadow-neon: 0 0 30px rgba(99, 102, 241, 0.2);
          --radius-sm: 12px;
          --theme-transition: 0.4s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
          background: var(--bg-primary);
          transition: background var(--theme-transition);
        }

        /* Light Theme */
        .register-page-container.light {
          --bg-primary: #f0f4ff;
          --bg-panel: rgba(255, 255, 255, 0.85);
          --bg-card: rgba(0, 0, 0, 0.03);
          --bg-input: rgba(255, 255, 255, 0.9);
          --text-primary: #0a1628;
          --text-secondary: #2a3a6a;
          --text-muted: #4a5a7a;
          --border: rgba(0, 0, 0, 0.08);
          --border-glow: rgba(37, 99, 235, 0.3);
          --accent-cyan: #2563eb;
          --accent-blue: #3b82f6;
          --shadow-neon: 0 0 30px rgba(37, 99, 235, 0.15);
        }

        .theme-toggle-fab {
          position: fixed;
          top: 24px;
          right: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 100;
          padding: 0;
        }
        .theme-toggle-fab:hover {
          transform: scale(1.1) rotate(15deg);
          border-color: var(--border-glow);
          box-shadow: var(--shadow-neon);
        }

        .theme-toggle-fab svg {
          stroke: currentColor;
          transition: transform 0.3s ease;
        }

        .theme-toggle-fab:hover svg {
          transform: rotate(30deg);
        }

        /* Aurora Background */
        .aurora-container {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .aurora-blur-1,
        .aurora-blur-2,
        .aurora-blur-3 {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
          transition: opacity var(--theme-transition);
        }

        .aurora-blur-1 {
          width: 600px;
          height: 600px;
          background: #4f46e5;
          top: -10%;
          left: -5%;
        }
        .aurora-blur-2 {
          width: 500px;
          height: 500px;
          background: #0ea5e9;
          bottom: -10%;
          right: -5%;
        }
        .aurora-blur-3 {
          width: 400px;
          height: 400px;
          background: #8b5cf6;
          top: 50%;
          left: 40%;
        }

        .register-page-container.light .aurora-blur-1,
        .register-page-container.light .aurora-blur-2,
        .register-page-container.light .aurora-blur-3 {
          opacity: 0.1;
        }

        .glass-capsule {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 28px;
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.1);
          transition: all var(--theme-transition);
          min-height: 600px;
          position: relative;
          z-index: 1;
        }

        /* Left Side - Hero Section */
        .register-hero-section {
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-overlay {
          background: transparent;
          padding: 0;
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .register-page-container.light .hero-overlay {
          background: transparent;
        }

        .hero-content {
          text-align: center;
          max-width: 400px;
        }

        /* Right Side - Registration Form */
        .register-form-section {
          padding: 40px 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 1px solid var(--border);
        }

        .form-wrapper {
          width: 100%;
          max-width: 480px;
        }

        .form-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--text-primary);
        }

        .form-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-bottom: 24px;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.02em;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 12px;
          font-size: 1rem;
          pointer-events: none;
          color: var(--text-muted);
          z-index: 2;
        }

        .input-premium {
          width: 100%;
          padding: 12px 16px 12px 38px;
          background: var(--bg-input);
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 0.95rem;
          transition: all 0.3s ease;
          outline: none;
        }

        /* Select Premium Styling */
        .select-premium {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
          cursor: pointer;
          background-color: var(--bg-input);
          border-radius: 12px;
        }

        .register-page-container:not(.light) .select-premium {
          background-color: rgba(255, 255, 255, 0.08);
          color: #eef2ff;
          border-color: rgba(255, 255, 255, 0.1);
          
        }
        .select-premium option {
          border-radius: 10px;
          padding: 10px 14px;
          margin: 2px 0;
        }

        .select-premium option:hover {
          border-radius: 10px;
        }
        .register-page-container:not(.light) .select-premium option {
          background: #1a1a2e;
          color: #eef2ff;
          padding: 8px;
        }

        .register-page-container.light .select-premium {
          background-color: #ffffff;
          color: #0a1628;
          border-color: rgba(0, 0, 0, 0.1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .register-page-container.light .select-premium option {
          background: #ffffff;
          color: #0a1628;
          padding: 8px;
        }

        .select-premium:focus {
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }

        .register-page-container.light .select-premium:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .input-premium:hover:not(:disabled) {
          border-color: var(--border-glow);
        }

        /* Password toggle button */
        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: color 0.2s ease;
          z-index: 2;
        }

        .password-toggle-btn:hover {
          color: var(--text-primary);
        }

        .password-toggle-btn svg {
          stroke: currentColor;
        }

        /* Dark mode input */
        .register-page-container:not(.light) .input-premium {
          background: rgba(255, 255, 255, 0.08);
          color: #eef2ff;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .register-page-container:not(.light) .input-premium:focus {
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
        }

        .register-page-container:not(.light) .input-premium::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .register-page-container:not(.light) .password-toggle-btn {
          color: rgba(255, 255, 255, 0.4);
        }

        .register-page-container:not(.light) .password-toggle-btn:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Light mode input */
        .register-page-container.light .input-premium {
          background: #ffffff;
          color: #0a1628;
          border-color: rgba(0, 0, 0, 0.1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .register-page-container.light .input-premium:focus {
          border-color: rgba(37, 99, 235, 0.4);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .register-page-container.light .input-premium::placeholder {
          color: rgba(0, 0, 0, 0.3);
        }

        .register-page-container.light .password-toggle-btn {
          color: rgba(0, 0, 0, 0.3);
        }

        .register-page-container.light .password-toggle-btn:hover {
          color: rgba(0, 0, 0, 0.6);
        }

        /* Dark mode field icon */
        .register-page-container:not(.light) .field-icon {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Light mode field icon */
        .register-page-container.light .field-icon {
          color: rgba(0, 0, 0, 0.3);
        }

        /* Dark mode labels */
        .register-page-container:not(.light) .field-group label {
          color: rgba(255, 255, 255, 0.7);
        }

        /* Light mode labels */
        .register-page-container.light .field-group label {
          color: rgba(0, 0, 0, 0.6);
        }

        .btn-premium {
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-cyan));

          color: white;
          font-weight: 600;
          padding: 14px 28px;
          border: none;
          border-radius: 99px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 25px rgba(37, 99, 235, 0.3);
          width: 100%;
        }

        .btn-premium:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 8px 35px rgba(37, 99, 235, 0.4);
        }

        .full-width {
          width: 100%;
          justify-content: center;
          grid-column: span 2;
        }

        .mt-2 { 
          margin-top: 4px; 
        }

        .form-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-secondary);
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }

        .form-footer a {
          color: var(--accent-cyan);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .form-footer a:hover {
          color: var(--accent-blue);
          text-decoration: underline;
        }

        .alert-box {
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          margin-bottom: 20px;
          border: 2px solid;
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .register-page-container.light .error-alert {
          background: rgba(239, 68, 68, 0.05);
          color: #dc2626;
          border-color: rgba(239, 68, 68, 0.2);
        }

        .success-alert {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.3);
        }

        .register-page-container.light .success-alert {
          background: rgba(34, 197, 94, 0.05);
          color: #16a34a;
          border-color: rgba(34, 197, 94, 0.2);
        }

        /* Responsive */
        @media (max-width: 992px) {
          .glass-capsule {
            grid-template-columns: 1fr;
            max-width: 600px;
            min-height: auto;
          }

          .register-hero-section {
            border-bottom: 1px solid var(--border);
            min-height: 200px;
            border-right: none;
          }

          .register-form-section {
            padding: 32px 24px;
            border-left: none;
          }

          .full-width {
            grid-column: span 1;
          }
        }

        @media (max-width: 640px) {
          .register-page-container {
            padding: 16px;
          }

          .glass-capsule {
            border-radius: 20px;
          }

          .register-hero-section {
            min-height: 150px;
          }

          .register-form-section {
            padding: 24px 16px;
          }

          .form-title {
            font-size: 1.6rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .full-width {
            grid-column: span 1;
          }

          .theme-toggle-fab {
            width: 40px;
            height: 40px;
            top: 16px;
            right: 16px;
          }
        }

        /* Disabled button state */
        .btn-premium:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        /* Input autofill styles */
        .input-premium:-webkit-autofill,
        .input-premium:-webkit-autofill:hover,
        .input-premium:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px var(--bg-input) inset !important;
          -webkit-text-fill-color: var(--text-primary) !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .register-page-container.light .input-premium:-webkit-autofill,
        .register-page-container.light .input-premium:-webkit-autofill:hover,
        .register-page-container.light .input-premium:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-text-fill-color: #0a1628 !important;
        }

        /* Select autofill fix */
        select.input-premium:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px var(--bg-input) inset !important;
          -webkit-text-fill-color: var(--text-primary) !important;
        }

        /* Option styling */
        select.input-premium option {
          padding: 8px;
          font-size: 0.95rem;
        }

        /* Hover effect for select options */
        select.input-premium option:hover {
          background: var(--accent-blue);
          color: white;
        }

        .glass-capsule.slide-in {
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
      `}</style>
    </div>
  );
}