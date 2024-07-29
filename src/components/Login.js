import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Layout, message, Card, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import tvImage from '../assets/icons/tv.png';

const { Content } = Layout;

const Login = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(180); // 3 minutes in seconds
  const [otpSent, setOtpSent] = useState(false); // Flag to track if OTP has been sent
  const [isSignupVisible, setIsSignupVisible] = useState(false); // State for signup modal
  const [form] = Form.useForm();
  const [signupForm] = Form.useForm(); // Form for signup

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setOtpSent(false);
      message.error('OTP expired. Please request a new one.');
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const onFinish = async (values) => {
    try {
      const response = await axios.post('http://localhost:5001/login', values);
      localStorage.setItem('token', response.data.token);
      message.success('Login successful');
      console.log('User logged in');
      navigate('/dashboard/home');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Uh oh. Something went wrong...');
      }
    }
  };

  const handleSendOtp = async () => {
    try {
      const response = await axios.post('http://localhost:5001/forgot-password', { email: forgotPasswordEmail });
      message.success(response.data.message);
      setTimer(180); // Reset timer to 3 minutes
      setEmailError('');
      setOtpSent(true); // Mark OTP as sent
      console.log('OTP sent');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setEmailError(error.response.data.message);
      } else {
        message.error('Uh oh. Something went wrong...');
      }
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await axios.post('http://localhost:5001/verify-otp', { email: forgotPasswordEmail, otp });
      message.success(response.data.message);
      setStep(3);
      console.log('OTP verified');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Uh oh. Something went wrong...');
      }
    }
  };

  const handleResetPassword = async () => {
    try {
      const response = await axios.post('http://localhost:5001/reset-password', { email: forgotPasswordEmail, otp, newPassword });
      message.success(response.data.message);
      handleCancel(); // Clear the form on successful reset
      console.log('Password reset successful');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Uh oh. Something went wrong...');
      }
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setStep(1);
    setOtpSent(false);
    setTimer(180);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    form.resetFields(['otp', 'newPassword', 'confirmPassword']);
  };

  const showForgotPasswordModal = () => {
    setIsModalVisible(true);
    setStep(1);
    setOtpSent(false);
    setTimer(180);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    form.resetFields(['otp', 'newPassword', 'confirmPassword']);
  };

  const handleGearClick = async () => {
    try {
      const response = await axios.post('http://localhost:5001/run-gear-functions');
      message.success(response.data.message);
      console.log('Gear functions run successfully');
    } catch (error) {
      message.error('Error running gear functions');
    }
  };

  const handleSignup = async (values) => {
    try {
      const response = await axios.post('http://localhost:5001/signup', values);
      message.success(response.data.message, 2, () => {
        setIsSignupVisible(false); // Hide the modal on successful signup
        console.log('User signed up');
      });
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Error signing up');
      }
    }
  };

  return (
    <Layout>
      <Content className="login-content">
        <Card className="login-card" bordered={true}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2>Welcome to Sri Sharadamba Temple, Milpitas</h2>
          </div>
          <div className="login-container">
            <div className="login-image" />
            <Form name="login_form" className="login-form" onFinish={onFinish}>
              <Form.Item
                name="usernameOrEmail"
                label="Username"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                rules={[{ required: true, message: 'Please input your Username or Email!' }]}
              >
                <Input placeholder="Username or Email" />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                rules={[{ required: true, message: 'Please input your Password!' }]}
              >
                <Input type="password" placeholder="Password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button">
                  Log In
                </Button>
              </Form.Item>
              <Form.Item>
                <div className="extra-buttons">
                  <Button type="default" onClick={showForgotPasswordModal} className="forgot-password-button">
                    Forgot Password
                  </Button>
                  <Button type="default" onClick={() => setIsSignupVisible(true)} className="signup-form-button">
                    Sign Up
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </Card>

        <Modal
          title="Forgot Password"
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null}
        >
          <Form layout="vertical" form={form}>
            <Form.Item label="Email" validateStatus={emailError ? 'error' : ''} help={emailError || ''}>
              <Input
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleSendOtp}>
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
            </Form.Item>
            <Form.Item label="OTP" name="otp">
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the OTP sent to your email"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleVerifyOtp}>
                Verify OTP
              </Button>
            </Form.Item>
            {otpSent && (
              <div style={{ marginBottom: '10px' }}>Time remaining: {formatTimer(timer)}</div>
            )}
            {step === 3 && (
              <>
                <Form.Item
                  name="newPassword"
                  label="New Password"
                  rules={[{ required: true, message: 'Please input your new password!' }]}
                >
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                  />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'Please confirm your new password!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                </Form.Item>
              </>
            )}
            <Form.Item>
              {step === 3 && (
                <Button type="primary" onClick={handleResetPassword}>
                  Reset Password
                </Button>
              )}
              <Button style={{ marginLeft: '10px' }} onClick={handleCancel}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Sign Up"
          visible={isSignupVisible}
          onCancel={() => setIsSignupVisible(false)}
          footer={null}
          afterClose={() => signupForm.resetFields()} // This will clear the form fields
        >
          <Form
            name="signup_form"
            className="signup-form"
            form={signupForm} // Use signupForm for this modal
            onFinish={handleSignup}
          >
            <Form.Item name="email" rules={[{ required: true, message: 'Please input your Email!' }]}>
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item name="username" rules={[{ required: true, message: 'Please input your Username!' }]}>
              <Input placeholder="Username" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
              <Input type="password" placeholder="Password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your Password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input type="password" placeholder="Confirm Password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="signup-form-button">
                Sign Up
              </Button>
            </Form.Item>
            <Form.Item>
              <Button type="default" onClick={() => setIsSignupVisible(false)} className="back-button">
                Back to Login
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        <Button
          className="gear-button"
          onClick={handleGearClick}
        >
          <img src={tvImage} alt="TV" className="gear-button-image" />
        </Button>
      </Content>
    </Layout>
  );
};

export default Login;
